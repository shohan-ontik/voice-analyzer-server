import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';

export function validate(schema: z.ZodObject<{ body?: z.ZodTypeAny; query?: z.ZodTypeAny; params?: z.ZodTypeAny }>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query as typeof req.query;
      if (parsed.params !== undefined) req.params = parsed.params as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({ error: { message: 'Invalid request.', details: err.flatten() } });
        return;
      }
      next(err);
    }
  };
}
