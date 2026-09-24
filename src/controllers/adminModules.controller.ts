import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { materialTypeForMimeType } from '../config/upload';
import {
  createChapterForAdmin,
  createMaterialForAdmin,
  createModuleForAdmin,
  deleteChapterForAdmin,
  deleteMaterialForAdmin,
  deleteModuleForAdmin,
  getModuleForAdmin,
  listModulesForAdmin,
  updateChapterForAdmin,
  updateModuleForAdmin,
  upsertExamForAdmin,
} from '../services/module.service';

export const listAdminModulesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const result = await listModulesForAdmin({ page, pageSize });
  res.json(result);
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

export const deleteModuleHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteModuleForAdmin(req.params.id);
  res.status(204).send();
});

export const createChapterHandler = asyncHandler(async (req: Request, res: Response) => {
  const chapter = await createChapterForAdmin(req.params.id, req.body);
  res.status(201).json(chapter);
});

export const updateChapterHandler = asyncHandler(async (req: Request, res: Response) => {
  const chapter = await updateChapterForAdmin(req.params.id, req.params.chapterId, req.body);
  res.json(chapter);
});

export const deleteChapterHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteChapterForAdmin(req.params.id, req.params.chapterId);
  res.status(204).send();
});

export const createMaterialHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('A file is required.');
  }

  const type = materialTypeForMimeType(req.file.mimetype);
  if (!type) {
    throw ApiError.badRequest('Unsupported file type.');
  }

  const meta =
    type === 'pdf' ? 'PDF' : `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;

  const material = await createMaterialForAdmin(req.params.id, req.params.chapterId, {
    title: req.body.title,
    type,
    meta,
    filename: req.file.originalname,
    storageKey: req.file.filename,
    mimeType: req.file.mimetype,
  });
  res.status(201).json(material);
});

export const deleteMaterialHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteMaterialForAdmin(req.params.id, req.params.chapterId, req.params.materialId);
  res.status(204).send();
});

export const upsertExamHandler = asyncHandler(async (req: Request, res: Response) => {
  const exam = await upsertExamForAdmin(req.params.id, req.body);
  res.json(exam);
});
