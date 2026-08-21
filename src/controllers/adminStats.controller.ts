import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getAdminStatsSummary } from '../services/adminStats.service';

export const getAdminStatsSummaryHandler = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getAdminStatsSummary();
  res.json(stats);
});
