import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getModuleForUser, listExamsForUser, listModulesForUser, markMaterialComplete } from '../services/module.service';

export const listModulesHandler = asyncHandler(async (req: Request, res: Response) => {
  const items = await listModulesForUser(req.user!.id);
  res.json({ items });
});

export const listExamsHandler = asyncHandler(async (req: Request, res: Response) => {
  const items = await listExamsForUser(req.user!.id);
  res.json({ items });
});

export const getModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const trainingModule = await getModuleForUser(req.params.slug, req.user!.id);
  res.json(trainingModule);
});

export const markMaterialCompleteHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await markMaterialComplete(req.user!.id, req.params.slug, req.params.chapterSlug, req.params.materialId);
  res.json(result);
});
