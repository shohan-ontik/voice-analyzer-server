import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createScoreCategory,
  deleteScoreCategory,
  listActiveScoreCategories,
  listScoreCategories,
  updateScoreCategory,
} from '../services/scoreCategory.service';

export const createScoreCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = await createScoreCategory(req.body);
  res.status(201).json(category);
});

export const listScoreCategoriesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, q, isActive } = req.query as unknown as {
    page: number;
    pageSize: number;
    q?: string;
    isActive?: boolean;
  };
  const result = await listScoreCategories({ page, pageSize, q, isActive });
  res.json(result);
});

export const listActiveScoreCategoriesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listActiveScoreCategories();
  res.json({ items: categories });
});

export const updateScoreCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const category = await updateScoreCategory(req.params.id, req.body);
  res.json(category);
});

export const deleteScoreCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteScoreCategory(req.params.id);
  res.status(204).send();
});
