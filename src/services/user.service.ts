import { Op, fn, col } from 'sequelize';
import { ModuleChapter, PracticeSession, TrainingModule, User, UserChapterProgress } from '../models';
import { ApiError } from '../utils/ApiError';
import { generateTempPassword, hashPassword } from './auth.service';

export async function createUser(input: {
  username: string;
  phone: string;
  name: string;
  role?: 'user' | 'admin';
  tempPassword?: string;
  employeeId?: string;
  department?: string;
  jobTitle?: string;
}) {
  const username = input.username.trim().toLowerCase();
  const phone = input.phone.trim();

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    throw ApiError.conflict('A user with this username already exists.');
  }

  const existingPhone = await User.findOne({ where: { phone } });
  if (existingPhone) {
    throw ApiError.conflict('A user with this phone number already exists.');
  }

  if (input.employeeId) {
    const existingEmployeeId = await User.findOne({ where: { employeeId: input.employeeId } });
    if (existingEmployeeId) {
      throw ApiError.conflict('A user with this employee ID already exists.');
    }
  }

  const tempPassword = input.tempPassword ?? generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await User.create({
    username,
    phone,
    name: input.name,
    passwordHash,
    role: input.role ?? 'user',
    mustChangePassword: true,
    employeeId: input.employeeId ?? null,
    department: input.department ?? null,
    jobTitle: input.jobTitle ?? null,
  });

  return { user, tempPassword };
}

// Per-user training progress for the admin list: chapters completed (out of
// the chapters in currently active modules — what a trainee can actually
// see) and the average overall score across all their practice sessions
// (null when they have none yet).
async function getUserProgress(userIds: string[]) {
  const progress = new Map<string, { completedChapters: number; avgScore: number | null }>();
  for (const id of userIds) progress.set(id, { completedChapters: 0, avgScore: null });

  const activeChapters = await ModuleChapter.findAll({
    attributes: ['id'],
    include: [{ model: TrainingModule, as: 'module', attributes: [], where: { isActive: true }, required: true }],
  });
  const activeChapterIds = activeChapters.map((c) => c.id);
  const totalChapters = activeChapterIds.length;

  if (userIds.length === 0) return { progress, totalChapters };

  const [completedRows, scoreRows] = await Promise.all([
    activeChapterIds.length
      ? (UserChapterProgress.findAll({
          attributes: ['userId', [fn('COUNT', col('id')), 'completed']],
          where: { userId: userIds, chapterId: activeChapterIds, completedAt: { [Op.ne]: null } },
          group: ['userId'],
          raw: true,
        }) as unknown as Promise<{ userId: string; completed: string }[]>)
      : Promise.resolve([]),
    PracticeSession.findAll({
      attributes: ['userId', [fn('AVG', col('overallScore')), 'avgScore']],
      where: { userId: userIds },
      group: ['userId'],
      raw: true,
    }) as unknown as Promise<{ userId: string; avgScore: string }[]>,
  ]);

  for (const row of completedRows) {
    progress.get(row.userId)!.completedChapters = Number(row.completed);
  }
  for (const row of scoreRows) {
    progress.get(row.userId)!.avgScore = Math.round(Number(row.avgScore));
  }

  return { progress, totalChapters };
}

export async function listUsers(params: { page: number; pageSize: number; q?: string; isBanned?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize's WhereOptions typing doesn't compose well with conditionally-built clauses.
  const where: any = {};
  if (params.q) {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${params.q}%` } },
      { phone: { [Op.iLike]: `%${params.q}%` } },
      { name: { [Op.iLike]: `%${params.q}%` } },
      { employeeId: { [Op.iLike]: `%${params.q}%` } },
    ];
  }
  if (typeof params.isBanned === 'boolean') {
    where.isBanned = params.isBanned;
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  });

  const totalPages = Math.ceil(count / params.pageSize);
  const { progress, totalChapters } = await getUserProgress(rows.map((u) => u.id));

  return {
    items: rows.map((u) => ({
      ...u.toSafeJSON(),
      completedChapters: progress.get(u.id)!.completedChapters,
      totalChapters,
      avgScore: progress.get(u.id)!.avgScore,
    })),
    page: params.page,
    total: count,
    pageSize: params.pageSize,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

export async function deleteUser(targetId: string, requesterId: string) {
  if (targetId === requesterId) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }

  const user = await User.findByPk(targetId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  // practice_sessions and user_chapter_progress rows CASCADE on userId, so
  // this also removes the user's practice history and chapter progress.
  await user.destroy();
}

export async function resetUserPassword(targetId: string) {
  const user = await User.findByPk(targetId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const tempPassword = generateTempPassword();
  user.passwordHash = await hashPassword(tempPassword);
  user.mustChangePassword = true;
  // Invalidate any sessions issued under the old password.
  user.tokenVersion += 1;
  await user.save();

  return { user, tempPassword };
}

export async function setUserBanned(targetId: string, requesterId: string, banned: boolean) {
  if (targetId === requesterId && banned) {
    throw ApiError.badRequest('You cannot ban your own account.');
  }

  const user = await User.findByPk(targetId);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  user.isBanned = banned;
  if (banned) {
    user.tokenVersion += 1;
  }
  await user.save();

  return user.toSafeJSON();
}
