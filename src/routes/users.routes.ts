import { Router } from 'express';
import {
  banUserHandler,
  createUserHandler,
  deleteUserHandler,
  listUsersHandler,
  resetUserPasswordHandler,
  unbanUserHandler,
} from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createUserSchema, listUsersSchema, userIdParamSchema } from '../validators/user.schema';

export const usersRouter = Router();

usersRouter.use(authenticate, requireAdmin);

usersRouter.post('/', validate(createUserSchema), createUserHandler);
usersRouter.get('/', validate(listUsersSchema), listUsersHandler);
usersRouter.post('/:id/reset-password', validate(userIdParamSchema), resetUserPasswordHandler);
usersRouter.post('/:id/ban', validate(userIdParamSchema), banUserHandler);
usersRouter.post('/:id/unban', validate(userIdParamSchema), unbanUserHandler);
usersRouter.delete('/:id', validate(userIdParamSchema), deleteUserHandler);
