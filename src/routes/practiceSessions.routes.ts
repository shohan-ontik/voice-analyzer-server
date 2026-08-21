import { Router } from 'express';
import {
  createPracticeSessionHandler,
  getOwnPracticeSessionHandler,
  getOwnStatsSummaryHandler,
  listOwnPracticeSessionsHandler,
} from '../controllers/practiceSessions.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createPracticeSessionSchema,
  listPracticeSessionsSchema,
  practiceSessionIdParamSchema,
} from '../validators/practiceSession.schema';

export const practiceSessionsRouter = Router();

practiceSessionsRouter.use(authenticate);

practiceSessionsRouter.post('/', validate(createPracticeSessionSchema), createPracticeSessionHandler);
practiceSessionsRouter.get('/', validate(listPracticeSessionsSchema), listOwnPracticeSessionsHandler);
// Must be registered before the `/:id` route below, or Express will treat
// "stats" as an :id value.
practiceSessionsRouter.get('/stats/summary', getOwnStatsSummaryHandler);
practiceSessionsRouter.get('/:id', validate(practiceSessionIdParamSchema), getOwnPracticeSessionHandler);
