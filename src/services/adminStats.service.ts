import { Op } from 'sequelize';
import { PracticeSession, User } from '../models';

export async function getAdminStatsSummary() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, bannedUsers, totalPracticeSessions, sessionsThisWeek] = await Promise.all([
    User.count(),
    User.count({ where: { isBanned: true } }),
    PracticeSession.count(),
    PracticeSession.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
  ]);

  return { totalUsers, bannedUsers, totalPracticeSessions, sessionsThisWeek };
}
