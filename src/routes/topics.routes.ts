import { Router } from 'express';
import { listActiveTopicsHandler } from '../controllers/topics.controller';
import { authenticate } from '../middleware/authenticate';

export const topicsRouter = Router();

// Any authenticated user (the practice app's scenario picker) — active
// topics only, no admin fields like the full CRUD list has.
topicsRouter.get('/', authenticate, listActiveTopicsHandler);
