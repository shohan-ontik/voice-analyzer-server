import { Router } from 'express';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';
import { practiceSessionsRouter } from './practiceSessions.routes';
import { adminStatsRouter } from './adminStats.routes';
import { adminTopicsRouter } from './adminTopics.routes';
import { topicsRouter } from './topics.routes';

export const apiRouter = Router();

apiRouter.get('/healthz', (_req, res) => res.json({ ok: true }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/users', usersRouter);
apiRouter.use('/admin/stats', adminStatsRouter);
apiRouter.use('/admin/topics', adminTopicsRouter);
apiRouter.use('/topics', topicsRouter);
apiRouter.use('/practice-sessions', practiceSessionsRouter);
