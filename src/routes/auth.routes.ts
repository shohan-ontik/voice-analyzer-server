import { Router } from 'express';
import { changePassword, login, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { changePasswordSchema, loginSchema } from '../validators/auth.schema';

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), login);
authRouter.get('/me', authenticate, me);
authRouter.patch('/me/password', authenticate, validate(changePasswordSchema), changePassword);
