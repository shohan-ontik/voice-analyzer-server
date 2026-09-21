import { Op } from 'sequelize';
import type { Request, Response } from 'express';
import { User } from '../models';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword, signAccessToken, verifyPassword } from '../services/auth.service';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password, rememberMe } = req.body as {
    identifier: string;
    password: string;
    rememberMe?: boolean;
  };
  const normalizedIdentifier = identifier.trim().toLowerCase();

  const user = await User.findOne({
    where: { [Op.or]: [{ username: normalizedIdentifier }, { phone: identifier.trim() }] },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid username/phone or password.');
  }
  if (user.isBanned) {
    throw ApiError.forbidden('This account has been suspended.');
  }

  const isFirstLogin = user.firstLoginAt === null;
  const now = new Date();
  user.lastLoginAt = now;
  if (isFirstLogin) {
    user.firstLoginAt = now;
  }
  await user.save();

  const accessToken = signAccessToken(user, rememberMe === true);
  res.json({ accessToken, user: user.toSafeJSON(), isFirstLogin });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByPk(req.user!.id);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists.');
  }
  res.json(user.toSafeJSON());
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  const user = await User.findByPk(req.user!.id);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists.');
  }
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest('Current password is incorrect.');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  res.json({ success: true });
});
