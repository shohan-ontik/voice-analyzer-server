import { Router } from 'express';
import { streamMaterialPdfHandler, streamMaterialVideoHandler } from '../controllers/media.controller';
import { authenticate } from '../middleware/authenticate';

export const mediaRouter = Router();

mediaRouter.use(authenticate);

mediaRouter.get('/materials/:materialId/video', streamMaterialVideoHandler);
mediaRouter.get('/materials/:materialId/pdf', streamMaterialPdfHandler);
