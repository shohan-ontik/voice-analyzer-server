import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getModuleForUser, listExamsForUser, listModulesForUser, markMaterialComplete } from '../services/module.service';

export const listModulesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const result = await listModulesForUser(req.user!.id, { page, pageSize });
  res.json(result);
});

export const listExamsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const result = await listExamsForUser(req.user!.id, { page, pageSize });
  res.json(result);
});

export const getModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const trainingModule = await getModuleForUser(req.params.slug, req.user!.id);
  res.json(trainingModule);
});

export const markMaterialCompleteHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await markMaterialComplete(req.user!.id, req.params.slug, req.params.chapterSlug, req.params.materialId);
  res.json(result);
});
