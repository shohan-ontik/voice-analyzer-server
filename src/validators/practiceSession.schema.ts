import { z } from 'zod';
import { SCENARIO_KEYS } from '../models/practiceSession.model';

const categorySchema = z.object({
  key: z.enum(['presentation', 'correctness', 'pronunciation', 'soft']),
  name: z.string(),
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
    scenario: z.enum(SCENARIO_KEYS),
    overall: z.number().min(0).max(100),
    verdict: z.string(),
    categories: z.array(categorySchema).length(4),
    transcript: z.array(transcriptSegmentSchema),
  }),
});

export const listPracticeSessionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    scenario: z.enum(SCENARIO_KEYS).optional(),
  }),
});

export const practiceSessionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
