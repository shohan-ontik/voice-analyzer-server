import { z } from 'zod';

export const listModulesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const listExamsSchema = z.object({
  query: listModulesSchema.shape.query.extend({
    // `order` = the module's curriculum order (the default); `dueDate` =
    // the exam's due date, with exams that have no due date always last.
    sortBy: z.enum(['order', 'dueDate']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export type ListExamsQuery = z.infer<typeof listExamsSchema>['query'];

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
