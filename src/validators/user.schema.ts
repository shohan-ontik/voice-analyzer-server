import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1).max(255),
    role: z.enum(['user', 'admin']).optional(),
    tempPassword: z.string().min(8).optional(),
    employeeId: z.string().min(1).max(64).optional(),
    department: z.string().min(1).max(255).optional(),
    jobTitle: z.string().min(1).max(255).optional(),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    q: z.string().optional(),
    isBanned: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
