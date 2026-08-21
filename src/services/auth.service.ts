import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomInt } from 'node:crypto';
import { env } from '../config/env';
import type { User, UserRole } from '../models/user.model';

const BCRYPT_COST = 12;
const TOKEN_EXPIRY = '8h';

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  tv: number;
};

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(user: User) {
  const payload: AccessTokenPayload = {
    sub: user.id,
    role: user.role,
    tv: user.tokenVersion,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generateTempPassword(length = 12) {
  return Array.from({ length }, () => TEMP_PASSWORD_CHARS[randomInt(TEMP_PASSWORD_CHARS.length)]).join('');
}
