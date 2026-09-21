import { Op } from 'sequelize';
import { Exam, PracticeSession } from '../models';
import type { CategoryBreakdown, TranscriptSegment } from '../models/practiceSession.model';
import { ApiError } from '../utils/ApiError';

// A "pitch" is any practice session that isn't a graded exam attempt
// (examId null) — ad-hoc /record practice and chapter roleplay practice
// both count toward it.
export const MAX_PITCHES_PER_MONTH = 125;

// Flat pass mark for pitch practice (no admin-configured mark like exams
// have). Snapshotted onto the row at creation, same as an exam's passMark.
export const PITCH_PRACTICE_PASS_MARK = 60;

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function createPracticeSession(
  userId: string,
  input: {
    topicId?: string | null;
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
    const pitchesThisMonth = await PracticeSession.count({
      where: { userId, examId: null, createdAt: { [Op.gte]: startOfCurrentMonth() } },
    });
    if (pitchesThisMonth >= MAX_PITCHES_PER_MONTH) {
      throw ApiError.badRequest(`You've reached the maximum of ${MAX_PITCHES_PER_MONTH} pitches for this month.`);
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
    topicId: input.topicId ?? null,
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
  params: { page: number; pageSize: number; topicId?: string }
) {
  const where: { userId: string; topicId?: string } = { userId };
  if (params.topicId) {
    where.topicId = params.topicId;
  }

  const { rows, count } = await PracticeSession.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  });

  return { items: rows, total: count, page: params.page, pageSize: params.pageSize };
}

export async function getOwnPracticeSession(userId: string, id: string) {
  const session = await PracticeSession.findOne({ where: { id, userId } });
  if (!session) {
    throw ApiError.notFound('Practice session not found.');
  }
  return session;
}

export async function getOwnStatsSummary(userId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = startOfCurrentMonth();

  const [latest, total, recent, scoreSum, pitchesThisMonth, totalPitchesEvaluated] = await Promise.all([
    PracticeSession.findOne({ where: { userId }, order: [['createdAt', 'DESC']] }),
    PracticeSession.count({ where: { userId } }),
    PracticeSession.findAll({ where: { userId, createdAt: { [Op.gte]: sevenDaysAgo } } }),
    PracticeSession.sum('overallScore', { where: { userId } }),
    PracticeSession.count({ where: { userId, examId: null, createdAt: { [Op.gte]: startOfMonth } } }),
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
    // the current calendar month.
    pitchesRemainingThisMonth: Math.max(0, MAX_PITCHES_PER_MONTH - pitchesThisMonth),
    // Total pitches (non-exam sessions) the user has ever participated in.
    totalPitchesEvaluated,
  };
}
