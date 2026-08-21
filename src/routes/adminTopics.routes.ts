import { Router } from 'express';
import { createTopicHandler, deleteTopicHandler, listTopicsHandler, updateTopicHandler } from '../controllers/topics.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createTopicSchema, listTopicsSchema, topicIdParamSchema, updateTopicSchema } from '../validators/topic.schema';

export const adminTopicsRouter = Router();

adminTopicsRouter.use(authenticate, requireAdmin);

adminTopicsRouter.post('/', validate(createTopicSchema), createTopicHandler);
adminTopicsRouter.get('/', validate(listTopicsSchema), listTopicsHandler);
adminTopicsRouter.patch('/:id', validate(updateTopicSchema), updateTopicHandler);
adminTopicsRouter.delete('/:id', validate(topicIdParamSchema), deleteTopicHandler);
