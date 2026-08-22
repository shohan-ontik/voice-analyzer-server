import { z } from 'zod';

export const createScoreCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
  }),
});

export const updateScoreCategorySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listScoreCategoriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(50),
    q: z.string().optional(),
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  }),
});

export const scoreCategoryIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
