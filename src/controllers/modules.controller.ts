import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getModuleForUser, listModulesForUser, markChapterComplete } from '../services/module.service';

export const listModulesHandler = asyncHandler(async (req: Request, res: Response) => {
  const items = await listModulesForUser(req.user!.id);
  res.json({ items });
});

export const getModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const trainingModule = await getModuleForUser(req.params.slug, req.user!.id);
  res.json(trainingModule);
});

export const markChapterCompleteHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await markChapterComplete(req.user!.id, req.params.slug, req.params.chapterSlug);
  res.json(result);
});
