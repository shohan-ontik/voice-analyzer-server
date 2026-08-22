import { Router } from 'express';
import {
  createScoreCategoryHandler,
  deleteScoreCategoryHandler,
  listScoreCategoriesHandler,
  updateScoreCategoryHandler,
} from '../controllers/scoreCategories.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import {
  createScoreCategorySchema,
  listScoreCategoriesSchema,
  scoreCategoryIdParamSchema,
  updateScoreCategorySchema,
} from '../validators/scoreCategory.schema';

export const adminScoreCategoriesRouter = Router();

adminScoreCategoriesRouter.use(authenticate, requireAdmin);

adminScoreCategoriesRouter.post('/', validate(createScoreCategorySchema), createScoreCategoryHandler);
adminScoreCategoriesRouter.get('/', validate(listScoreCategoriesSchema), listScoreCategoriesHandler);
adminScoreCategoriesRouter.patch('/:id', validate(updateScoreCategorySchema), updateScoreCategoryHandler);
adminScoreCategoriesRouter.delete('/:id', validate(scoreCategoryIdParamSchema), deleteScoreCategoryHandler);
