import { z } from 'zod';

export const createModuleSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
    thumbnailUrl: z.string().url().max(1000).optional(),
  }),
});

export const updateModuleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
    thumbnailUrl: z.string().url().max(1000).optional(),
    isActive: z.boolean().optional(),
    publishDate: z.string().date().nullable().optional(),
  }),
});

export const moduleIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const createChapterSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
  }),
});

export const chapterParamSchema = z.object({
  params: z.object({ id: z.string().uuid(), chapterId: z.string().uuid() }),
});

export const updateChapterSchema = z.object({
  params: z.object({ id: z.string().uuid(), chapterId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).optional(),
  }),
});

// Multer parses multipart fields into req.body as strings before this runs.
export const createMaterialSchema = z.object({
  params: z.object({ id: z.string().uuid(), chapterId: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(500),
  }),
});

export const materialParamSchema = z.object({
  params: z.object({ id: z.string().uuid(), chapterId: z.string().uuid(), materialId: z.string().uuid() }),
});

export const upsertExamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    scenario: z.string().max(10000).optional(),
    deadlineDays: z.coerce.number().int().min(0).max(365).nullable().optional(),
    passMark: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
