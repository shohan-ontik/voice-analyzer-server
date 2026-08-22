import { Router } from 'express';
import { listActiveScoreCategoriesHandler } from '../controllers/scoreCategories.controller';
import { authenticate } from '../middleware/authenticate';

export const scoreCategoriesRouter = Router();

// Any authenticated user (the practice app's scoring pipeline) — active
// categories only, no admin fields like the full CRUD list has.
scoreCategoriesRouter.get('/', authenticate, listActiveScoreCategoriesHandler);
