import type { Request, Response } from 'express';
import { User } from '../models';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword, signAccessToken, verifyPassword } from '../services/auth.service';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (user.isBanned) {
    throw ApiError.forbidden('This account has been suspended.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  res.json({ accessToken, user: user.toSafeJSON() });
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
