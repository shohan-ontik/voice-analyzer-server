import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getAdminStatsSummary, listRecentActivity } from '../services/adminStats.service';

export const getAdminStatsSummaryHandler = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getAdminStatsSummary();
  res.json(stats);
});

export const listRecentActivityHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  res.json(await listRecentActivity({ page, pageSize }));
});
