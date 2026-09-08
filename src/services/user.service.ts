import { Op } from 'sequelize';
import { User } from '../models';
import { ApiError } from '../utils/ApiError';
import { generateTempPassword, hashPassword } from './auth.service';

export async function createUser(input: {
  email: string;
  name: string;
  role?: 'user' | 'admin';
  tempPassword?: string;
  employeeId?: string;
  department?: string;
  jobTitle?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict('A user with this email already exists.');
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
    email,
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

export async function listUsers(params: { page: number; pageSize: number; q?: string; isBanned?: boolean }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sequelize's WhereOptions typing doesn't compose well with conditionally-built clauses.
  const where: any = {};
  if (params.q) {
    where[Op.or] = [
      { email: { [Op.iLike]: `%${params.q}%` } },
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

  return {
    items: rows.map((u) => u.toSafeJSON()),
    total: count,
    page: params.page,
    pageSize: params.pageSize,
  };
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
