import { Router } from 'express';
import { listNotificationsHandler, markNotificationReadHandler } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { listNotificationsSchema, notificationIdParamSchema } from '../validators/notification.schema';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get('/', validate(listNotificationsSchema), listNotificationsHandler);
notificationsRouter.post('/:id/read', validate(notificationIdParamSchema), markNotificationReadHandler);
