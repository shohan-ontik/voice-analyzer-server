import { Router } from 'express';
import { getAdminStatsSummaryHandler, listRecentActivityHandler } from '../controllers/adminStats.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { recentActivitySchema } from '../validators/adminStats.schema';

export const adminStatsRouter = Router();

adminStatsRouter.use(authenticate, requireAdmin);

adminStatsRouter.get('/summary', getAdminStatsSummaryHandler);
adminStatsRouter.get('/recent-activity', validate(recentActivitySchema), listRecentActivityHandler);
