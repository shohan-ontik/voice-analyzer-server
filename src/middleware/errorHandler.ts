import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { UniqueConstraintError, ValidationError as SequelizeValidationError } from 'sequelize';
import { ApiError } from '../utils/ApiError';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.path}` } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    return;
  }

  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ error: { message: 'A record with these details already exists.' } });
    return;
  }

  if (err instanceof SequelizeValidationError) {
    res.status(400).json({ error: { message: 'Invalid data.', details: err.errors.map((e) => e.message) } });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : `Upload failed: ${err.message}`;
    res.status(400).json({ error: { message } });
    return;
  }

  // The upload file-type filter (config/upload.ts) rejects via a plain Error.
  if (err instanceof Error && err.message.startsWith('Unsupported file type')) {
    res.status(400).json({ error: { message: err.message } });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: { message: 'Internal server error.' } });
}
