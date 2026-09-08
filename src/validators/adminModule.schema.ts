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
  }),
});

export const moduleIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
