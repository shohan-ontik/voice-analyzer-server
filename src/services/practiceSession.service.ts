import { Op } from 'sequelize';
import { Exam, ModuleChapter, PracticeSession, TrainingModule, User } from '../models';
import type { CategoryBreakdown, TranscriptSegment } from '../models/practiceSession.model';
import { ApiError } from '../utils/ApiError';

// A "pitch" is any practice session that isn't a graded exam attempt
// (examId null) — ad-hoc /record practice and chapter roleplay practice
// both count toward it.
export const MAX_PITCHES_PER_MONTH = 125;

// The pitch quota is per user, not per calendar month: it covers a rolling
// 30-day cycle that starts the moment the account was created and renews
// every 30 days after that.
const QUOTA_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

// Flat pass mark for pitch practice (no admin-configured mark like exams
// have). Snapshotted onto the row at creation, same as an exam's passMark.
export const PITCH_PRACTICE_PASS_MARK = 60;

// Start/end of the 30-day quota cycle the user is currently in, counted from
// their account creation date.
async function getPitchQuotaWindow(userId: string) {
  const user = await User.findByPk(userId, { attributes: ['id', 'createdAt'] });
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  const anchor = user.createdAt.getTime();
  const elapsedCycles = Math.max(0, Math.floor((Date.now() - anchor) / QUOTA_PERIOD_MS));
  const startsAt = new Date(anchor + elapsedCycles * QUOTA_PERIOD_MS);
  const resetsAt = new Date(startsAt.getTime() + QUOTA_PERIOD_MS);
  return { startsAt, resetsAt };
}

export async function createPracticeSession(
  userId: string,
  input: {
    chapterId?: string | null;
    examId?: string | null;
    topicName: string;
    overall: number;
    verdict: string;
    categories: CategoryBreakdown[];
    transcript: TranscriptSegment[];
  }
) {
  const examId = input.examId ?? null;

  let passMark = PITCH_PRACTICE_PASS_MARK;
  if (examId === null) {
    const { startsAt } = await getPitchQuotaWindow(userId);
    const pitchesThisPeriod = await PracticeSession.count({
      where: { userId, examId: null, createdAt: { [Op.gte]: startsAt } },
    });
    if (pitchesThisPeriod >= MAX_PITCHES_PER_MONTH) {
      throw ApiError.badRequest(`You've reached the maximum of ${MAX_PITCHES_PER_MONTH} pitches for this 30-day period.`);
    }
  } else {
    const exam = await Exam.findByPk(examId);
    if (!exam) {
      throw ApiError.notFound('Exam not found.');
    }
    passMark = exam.passMark;
  }

  return PracticeSession.create({
    userId,
    chapterId: input.chapterId ?? null,
    examId,
    type: examId ? 'exam' : 'pitch_practice',
    passMark,
    topicName: input.topicName,
    overallScore: input.overall,
    verdict: input.verdict,
    categories: input.categories,
    transcript: input.transcript,
  });
}

export async function listOwnPracticeSessions(
  userId: string,
  params: { page: number; pageSize: number }
) {
  const where = { userId };

  const { rows, count } = await PracticeSession.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  });

  const totalPages = Math.ceil(count / params.pageSize);

  return {
    items: rows,
    page: params.page,
    total: count,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

// Resolves where this session's "Practice Again" button should link back to
// (the specific chapter's roleplay, or the module exam) without the caller
// needing to cross-reference the full modules list — chapterId/examId alone
// aren't enough to build a URL, since routes are keyed by module+chapter
// slug, not id.
export async function getOwnPracticeSession(userId: string, id: string) {
  const session = await PracticeSession.findOne({
    where: { id, userId },
    include: [
      {
        model: ModuleChapter,
        as: 'chapter',
        attributes: ['slug'],
        include: [{ model: TrainingModule, as: 'module', attributes: ['slug'] }],
      },
      {
        model: Exam,
        as: 'exam',
        attributes: ['slug'],
        include: [{ model: TrainingModule, as: 'module', attributes: ['slug'] }],
      },
    ],
  });
  if (!session) {
    throw ApiError.notFound('Practice session not found.');
  }

  const moduleSlug = session.chapter?.module?.slug ?? session.exam?.module?.slug ?? null;
  const chapterSlug = session.chapter?.slug ?? null;

  // Drop the nested chapter/exam associations from the wire payload — only
  // the flat slugs above are what callers need.
  const { chapter: _chapter, exam: _exam, ...rest } = session.toJSON() as Record<string, unknown>;
  return { ...rest, moduleSlug, chapterSlug };
}

export async function getOwnStatsSummary(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { startsAt, resetsAt } = await getPitchQuotaWindow(userId);

  const [latest, total, recent, scoreSum, pitchesThisPeriod, totalPitchesEvaluated] = await Promise.all([
    PracticeSession.findOne({ where: { userId }, order: [['createdAt', 'DESC']] }),
    PracticeSession.count({ where: { userId } }),
    PracticeSession.findAll({ where: { userId, createdAt: { [Op.gte]: sevenDaysAgo } } }),
    PracticeSession.sum('overallScore', { where: { userId } }),
    PracticeSession.count({ where: { userId, examId: null, createdAt: { [Op.gte]: startsAt } } }),
    PracticeSession.count({ where: { userId, examId: null } }),
  ]);

  const sessionsThisWeek = recent.length;
  const averageScoreThisWeek = sessionsThisWeek
    ? Math.round(recent.reduce((sum, s) => sum + s.overallScore, 0) / sessionsThisWeek)
    : null;

  return {
    lastScore: latest?.overallScore ?? null,
    lastSessionAt: latest?.createdAt ?? null,
    sessionsThisWeek,
    averageScoreThisWeek,
    totalSessions: total,
    // Overall average across every session the user has ever recorded, not
    // just the last 7 days (averageScoreThisWeek above).
    averageScore: total ? Math.round((scoreSum ?? 0) / total) : null,
    // Pitches (non-exam sessions) remaining out of MAX_PITCHES_PER_MONTH for
    // the user's current 30-day cycle (counted from account creation). The
    // field keeps its "ThisMonth" name for client compatibility.
    pitchesRemainingThisMonth: Math.max(0, MAX_PITCHES_PER_MONTH - pitchesThisPeriod),
    // When the current cycle ends and the quota refills.
    pitchQuotaResetsAt: resetsAt,
    // Total pitches (non-exam sessions) the user has ever participated in.
    totalPitchesEvaluated,
  };
}
