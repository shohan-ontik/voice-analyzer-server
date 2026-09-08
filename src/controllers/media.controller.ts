import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { LearningMaterial } from '../models';
import type { LearningMaterialType } from '../models/learningMaterial.model';
import { ApiError } from '../utils/ApiError';

// Every material of a given type streams the same placeholder file for
// now — there's no per-material upload/storage pipeline yet. The endpoint
// still looks the material up so a bad/deleted id, or a type mismatch
// (e.g. requesting the video route for a pdf material), 404s instead of
// silently serving the wrong file.
const DEMO_FILES: Record<'video' | 'pdf', { path: string; contentType: string }> = {
  video: {
    path: path.join(__dirname, '../../storage/demo-chapter-video.mp4'),
    contentType: 'video/mp4',
  },
  pdf: {
    path: path.join(__dirname, '../../storage/demo-chapter-guide.pdf'),
    contentType: 'application/pdf',
  },
};

async function streamDemoFile(req: Request, res: Response, expectedType: LearningMaterialType) {
  const material = await LearningMaterial.findByPk(req.params.materialId);
  if (!material || material.type !== expectedType) {
    throw ApiError.notFound('Material not found.');
  }

  const demoFile = DEMO_FILES[expectedType as 'video' | 'pdf'];
  const stat = await fs.promises.stat(demoFile.path);
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      'Content-Type': demoFile.contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(demoFile.path).pipe(res);
    return;
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match?.[1] ? parseInt(match[1], 10) : 0;
  const end = match?.[2] ? parseInt(match[2], 10) : stat.size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= stat.size) {
    res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
    res.end();
    return;
  }

  res.writeHead(206, {
    'Content-Type': demoFile.contentType,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
  });
  fs.createReadStream(demoFile.path, { start, end }).pipe(res);
}

export const streamMaterialVideoHandler = asyncHandler((req: Request, res: Response) => streamDemoFile(req, res, 'video'));

export const streamMaterialPdfHandler = asyncHandler((req: Request, res: Response) => streamDemoFile(req, res, 'pdf'));
