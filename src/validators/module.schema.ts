import { z } from 'zod';

export const moduleSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const chapterCompleteParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    chapterSlug: z.string().min(1),
  }),
});
