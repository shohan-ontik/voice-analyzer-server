import { Router } from 'express';
import { getAdminStatsSummaryHandler } from '../controllers/adminStats.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';

export const adminStatsRouter = Router();

adminStatsRouter.use(authenticate, requireAdmin);

adminStatsRouter.get('/summary', getAdminStatsSummaryHandler);
