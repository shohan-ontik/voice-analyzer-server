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

// AI-generated in the admin app from the chapter's title/description (see
// generate-scenario there) and sent along with create/update requests.
const chapterScenarioSchema = z.object({
  clientInitials: z.string().min(1).max(10),
  clientName: z.string().min(1).max(255),
  clientTitle: z.string().min(1).max(255),
  objection: z.string().min(1).max(2000),
  objective: z.string().min(1).max(2000),
  criteria: z.array(z.string().min(1).max(500)).max(10),
});

export const createChapterSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
    scenario: chapterScenarioSchema.optional(),
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
    scenario: chapterScenarioSchema.optional(),
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
