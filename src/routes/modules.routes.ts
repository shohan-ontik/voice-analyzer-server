import { Router } from 'express';
import {
  getModuleHandler,
  listExamsHandler,
  listModulesHandler,
  markMaterialCompleteHandler,
} from '../controllers/modules.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  listExamsSchema,
  listModulesSchema,
  materialCompleteParamSchema,
  moduleSlugParamSchema,
} from '../validators/module.schema';

export const modulesRouter = Router();

modulesRouter.use(authenticate);

modulesRouter.get('/', validate(listModulesSchema), listModulesHandler);
// Must be registered before the `/:slug` route below, or Express will treat
// "exams" as a :slug value.
modulesRouter.get('/exams', validate(listExamsSchema), listExamsHandler);
modulesRouter.get('/:slug', validate(moduleSlugParamSchema), getModuleHandler);
modulesRouter.post(
  '/:slug/chapters/:chapterSlug/materials/:materialId/complete',
  validate(materialCompleteParamSchema),
  markMaterialCompleteHandler
);
