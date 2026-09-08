import { Router } from 'express';
import {
  createModuleHandler,
  getAdminModuleHandler,
  listAdminModulesHandler,
  updateModuleHandler,
} from '../controllers/adminModules.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createModuleSchema, moduleIdParamSchema, updateModuleSchema } from '../validators/adminModule.schema';

export const adminModulesRouter = Router();

adminModulesRouter.use(authenticate, requireAdmin);

adminModulesRouter.get('/', listAdminModulesHandler);
adminModulesRouter.post('/', validate(createModuleSchema), createModuleHandler);
adminModulesRouter.get('/:id', validate(moduleIdParamSchema), getAdminModuleHandler);
adminModulesRouter.patch('/:id', validate(updateModuleSchema), updateModuleHandler);
