import { Op } from 'sequelize';
import { PracticeSession } from '../models';
import type { CategoryBreakdown, TranscriptSegment } from '../models/practiceSession.model';
import { ApiError } from '../utils/ApiError';

export async function createPracticeSession(
  userId: string,
  input: {
    topicId?: string | null;
    topicName: string;
    overall: number;
    verdict: string;
    categories: CategoryBreakdown[];
    transcript: TranscriptSegment[];
  }
) {
  return PracticeSession.create({
    userId,
    topicId: input.topicId ?? null,
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

  const [latest, total, recent] = await Promise.all([
    PracticeSession.findOne({ where: { userId }, order: [['createdAt', 'DESC']] }),
    PracticeSession.count({ where: { userId } }),
    PracticeSession.findAll({ where: { userId, createdAt: { [Op.gte]: sevenDaysAgo } } }),
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
  };
}
