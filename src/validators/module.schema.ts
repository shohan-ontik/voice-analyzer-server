import { z } from 'zod';

export const listModulesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const listExamsSchema = listModulesSchema;

export const moduleSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const materialCompleteParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    chapterSlug: z.string().min(1),
    materialId: z.string().min(1),
  }),
});
