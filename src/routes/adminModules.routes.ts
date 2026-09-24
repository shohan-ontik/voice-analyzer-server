import { Router } from 'express';
import {
  createChapterHandler,
  createMaterialHandler,
  createModuleHandler,
  deleteChapterHandler,
  deleteMaterialHandler,
  deleteModuleHandler,
  getAdminModuleHandler,
  listAdminModulesHandler,
  updateChapterHandler,
  updateModuleHandler,
  upsertExamHandler,
} from '../controllers/adminModules.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { uploadMaterialFile } from '../config/upload';
import {
  chapterParamSchema,
  createChapterSchema,
  createMaterialSchema,
  createModuleSchema,
  listAdminModulesSchema,
  materialParamSchema,
  moduleIdParamSchema,
  updateChapterSchema,
  updateModuleSchema,
  upsertExamSchema,
} from '../validators/adminModule.schema';

export const adminModulesRouter = Router();

adminModulesRouter.use(authenticate, requireAdmin);

adminModulesRouter.get('/', validate(listAdminModulesSchema), listAdminModulesHandler);
adminModulesRouter.post('/', validate(createModuleSchema), createModuleHandler);
adminModulesRouter.get('/:id', validate(moduleIdParamSchema), getAdminModuleHandler);
adminModulesRouter.patch('/:id', validate(updateModuleSchema), updateModuleHandler);
adminModulesRouter.delete('/:id', validate(moduleIdParamSchema), deleteModuleHandler);

adminModulesRouter.post('/:id/chapters', validate(createChapterSchema), createChapterHandler);
adminModulesRouter.patch('/:id/chapters/:chapterId', validate(updateChapterSchema), updateChapterHandler);
adminModulesRouter.delete('/:id/chapters/:chapterId', validate(chapterParamSchema), deleteChapterHandler);

adminModulesRouter.post(
  '/:id/chapters/:chapterId/materials',
  uploadMaterialFile,
  validate(createMaterialSchema),
  createMaterialHandler
);
adminModulesRouter.delete(
  '/:id/chapters/:chapterId/materials/:materialId',
  validate(materialParamSchema),
  deleteMaterialHandler
);

adminModulesRouter.put('/:id/exam', validate(upsertExamSchema), upsertExamHandler);
