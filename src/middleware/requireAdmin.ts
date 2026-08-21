import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    next(ApiError.forbidden('Admin access required.'));
    return;
  }
  next();
}
