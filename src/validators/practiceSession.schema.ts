import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  tips: z.array(z.string()),
});

const transcriptSegmentSchema = z.object({
  text: z.string(),
  kind: z.enum(['plain', 'filler', 'pronunciation']),
});

export const createPracticeSessionSchema = z.object({
  body: z.object({
    topicId: z.string().uuid().nullable().optional(),
    topicName: z.string().min(1),
    overall: z.number().min(0).max(100),
    verdict: z.string(),
    categories: z.array(categorySchema).min(1),
    transcript: z.array(transcriptSegmentSchema),
  }),
});

export const listPracticeSessionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    topicId: z.string().uuid().optional(),
  }),
});

export const practiceSessionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
