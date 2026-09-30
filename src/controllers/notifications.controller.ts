import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { listNotificationsForUser, markNotificationRead } from '../services/notification.service';

export const listNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const result = await listNotificationsForUser(req.user!.id, { page, pageSize });
  res.json(result);
});

export const markNotificationReadHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await markNotificationRead(req.user!.id, req.params.id);
  res.json(result);
});
