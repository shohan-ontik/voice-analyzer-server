import { z } from 'zod';

export const createTopicSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    passage: z.string().min(1),
  }),
});

export const updateTopicSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    passage: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listTopicsSchema = z.object({
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

export const topicIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
