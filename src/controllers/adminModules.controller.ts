import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createModuleForAdmin,
  getModuleForAdmin,
  listModulesForAdmin,
  updateModuleForAdmin,
} from '../services/module.service';

export const listAdminModulesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const items = await listModulesForAdmin();
  res.json({ items });
});

export const createModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const trainingModule = await createModuleForAdmin(req.body);
  res.status(201).json(trainingModule);
});

export const getAdminModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const trainingModule = await getModuleForAdmin(req.params.id);
  res.json(trainingModule);
});

export const updateModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  const trainingModule = await updateModuleForAdmin(req.params.id, req.body);
  res.json(trainingModule);
});
