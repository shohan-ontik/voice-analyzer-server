import { Router } from 'express';
import { sequelize } from '../config/database';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';
import { practiceSessionsRouter } from './practiceSessions.routes';
import { adminStatsRouter } from './adminStats.routes';
import { adminTopicsRouter } from './adminTopics.routes';
import { topicsRouter } from './topics.routes';
import { adminScoreCategoriesRouter } from './adminScoreCategories.routes';
import { scoreCategoriesRouter } from './scoreCategories.routes';
import { modulesRouter } from './modules.routes';
import { mediaRouter } from './media.routes';
import { adminModulesRouter } from './adminModules.routes';

export const apiRouter = Router();

apiRouter.get('/healthz', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true, database: 'up' });
  } catch {
    res.status(503).json({ ok: false, database: 'down' });
  }
});
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/users', usersRouter);
apiRouter.use('/admin/stats', adminStatsRouter);
apiRouter.use('/admin/topics', adminTopicsRouter);
apiRouter.use('/topics', topicsRouter);
apiRouter.use('/admin/score-categories', adminScoreCategoriesRouter);
apiRouter.use('/score-categories', scoreCategoriesRouter);
apiRouter.use('/practice-sessions', practiceSessionsRouter);
apiRouter.use('/modules', modulesRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/admin/modules', adminModulesRouter);
