import { Router } from 'express';
import { getModuleHandler, listModulesHandler, markChapterCompleteHandler } from '../controllers/modules.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { chapterCompleteParamSchema, moduleSlugParamSchema } from '../validators/module.schema';

export const modulesRouter = Router();

modulesRouter.use(authenticate);

modulesRouter.get('/', listModulesHandler);
modulesRouter.get('/:slug', validate(moduleSlugParamSchema), getModuleHandler);
modulesRouter.post(
  '/:slug/chapters/:chapterSlug/complete',
  validate(chapterCompleteParamSchema),
  markChapterCompleteHandler
);
