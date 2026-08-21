import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import type { UserRole } from '../models/user.model';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../services/auth.service';

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  isBanned: boolean;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing bearer token.');
    }

    const token = header.slice('Bearer '.length);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Session expired.');
      }
      throw ApiError.unauthorized('Invalid token.');
    }

    // Always re-check against the live DB row: a ban or invalidated
    // session must take effect immediately, not only once the JWT expires.
    const user = await User.findByPk(payload.sub, {
      attributes: ['id', 'role', 'isBanned', 'tokenVersion'],
    });

    if (!user) {
      throw ApiError.unauthorized('User no longer exists.');
    }
    if (user.isBanned) {
      throw ApiError.forbidden('This account has been suspended.');
    }
    if (user.tokenVersion !== payload.tv) {
      throw ApiError.unauthorized('Session no longer valid. Please log in again.');
    }

    req.user = { id: user.id, role: user.role, isBanned: user.isBanned };
    next();
  } catch (err) {
    next(err);
  }
}
