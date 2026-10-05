import { Op, fn, col } from 'sequelize';
import { Exam, ModuleChapter, PracticeSession, TrainingModule, User } from '../models';

export async function getAdminStatsSummary() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, bannedUsers, totalPracticeSessions, sessionsThisWeek, examsTaken, avgScoreRow] = await Promise.all([
    User.count(),
    User.count({ where: { isBanned: true } }),
    PracticeSession.count(),
    PracticeSession.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
    PracticeSession.count({ where: { type: 'exam' } }),
    PracticeSession.findOne({
      attributes: [[fn('AVG', col('overallScore')), 'avgScore']],
      raw: true,
    }) as unknown as Promise<{ avgScore: string | null } | null>,
  ]);

  // Average overall score across every practice session (exam + pitch
  // practice) — the same definition as the per-user avgScore on the admin
  // users list. Null when there are no sessions yet.
  const avgProficiency = avgScoreRow?.avgScore == null ? null : Math.round(Number(avgScoreRow.avgScore));

  return { totalUsers, bannedUsers, totalPracticeSessions, sessionsThisWeek, examsTaken, avgProficiency };
}

// Most recent practice sessions across all users, newest first. `module` is
// the module the session belongs to (via its chapter, or its exam), falling
// back to the session's topic name for ad-hoc practice.
export async function listRecentActivity(params: { page: number; pageSize: number }) {
  const { rows, count } = await PracticeSession.findAndCountAll({
    include: [
      { model: User, as: 'user', attributes: ['id', 'name'], required: true },
      {
        model: ModuleChapter,
        as: 'chapter',
        attributes: ['id'],
        required: false,
        include: [{ model: TrainingModule, as: 'module', attributes: ['title'], required: false }],
      },
      { model: Exam, as: 'exam', attributes: ['moduleLabel'], required: false },
    ],
    order: [['createdAt', 'DESC']],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
    distinct: true,
  });

  const totalPages = Math.ceil(count / params.pageSize);

  return {
    items: rows.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: s.user!.name,
      module: s.chapter?.module?.title ?? s.exam?.moduleLabel ?? s.topicName,
      type: s.type,
      score: s.overallScore,
      createdAt: s.createdAt,
    })),
    page: params.page,
    total: count,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}
