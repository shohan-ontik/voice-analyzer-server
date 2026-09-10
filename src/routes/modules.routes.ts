import { Router } from 'express';
import { getModuleHandler, listModulesHandler, markMaterialCompleteHandler } from '../controllers/modules.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { materialCompleteParamSchema, moduleSlugParamSchema } from '../validators/module.schema';

export const modulesRouter = Router();

modulesRouter.use(authenticate);

modulesRouter.get('/', listModulesHandler);
modulesRouter.get('/:slug', validate(moduleSlugParamSchema), getModuleHandler);
modulesRouter.post(
  '/:slug/chapters/:chapterSlug/materials/:materialId/complete',
  validate(materialCompleteParamSchema),
  markMaterialCompleteHandler
);
