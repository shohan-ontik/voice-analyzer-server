import { Router } from 'express';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';
import { practiceSessionsRouter } from './practiceSessions.routes';

export const apiRouter = Router();

apiRouter.get('/healthz', (_req, res) => res.json({ ok: true }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/users', usersRouter);
apiRouter.use('/practice-sessions', practiceSessionsRouter);
