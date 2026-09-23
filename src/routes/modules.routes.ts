import { Router } from 'express';
import {
  getModuleHandler,
  listExamsHandler,
  listModulesHandler,
  markMaterialCompleteHandler,
} from '../controllers/modules.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { materialCompleteParamSchema, moduleSlugParamSchema } from '../validators/module.schema';

export const modulesRouter = Router();

modulesRouter.use(authenticate);

modulesRouter.get('/', listModulesHandler);
// Must be registered before the `/:slug` route below, or Express will treat
// "exams" as a :slug value.
modulesRouter.get('/exams', listExamsHandler);
modulesRouter.get('/:slug', validate(moduleSlugParamSchema), getModuleHandler);
modulesRouter.post(
  '/:slug/chapters/:chapterSlug/materials/:materialId/complete',
  validate(materialCompleteParamSchema),
  markMaterialCompleteHandler
);
