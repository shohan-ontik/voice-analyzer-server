import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { UPLOAD_DIR } from '../utils/uploadPath';
import { LearningMaterial } from '../models';
import type { LearningMaterialType } from '../models/learningMaterial.model';
import { ApiError } from '../utils/ApiError';

// Legacy/seeded materials have no uploaded file (storageKey is null) and
// stream one of these shared placeholders instead — there was no upload
// pipeline when they were created. There's no audio placeholder since
// nothing ever played seeded audio materials back.
const DEMO_FILES: Partial<Record<LearningMaterialType, { path: string; contentType: string }>> = {
  video: {
    path: path.join(__dirname, '../../storage/demo-chapter-video.mp4'),
    contentType: 'video/mp4',
  },
  pdf: {
    path: path.join(__dirname, '../../storage/demo-chapter-guide.pdf'),
    contentType: 'application/pdf',
  },
};

const DEFAULT_CONTENT_TYPE: Record<LearningMaterialType, string> = {
  video: 'video/mp4',
  pdf: 'application/pdf',
  audio: 'audio/mpeg',
};

async function resolveFile(material: LearningMaterial, expectedType: LearningMaterialType) {
  if (material.storageKey) {
    return {
      path: path.join(UPLOAD_DIR, material.storageKey),
      contentType: material.mimeType || DEFAULT_CONTENT_TYPE[expectedType],
    };
  }

  const demo = DEMO_FILES[expectedType];
  if (!demo) {
    throw ApiError.notFound('This material has no file.');
  }
  return demo;
}

async function streamMaterialFile(req: Request, res: Response, expectedType: LearningMaterialType) {
  const material = await LearningMaterial.findByPk(req.params.materialId);
  if (!material || material.type !== expectedType) {
    throw ApiError.notFound('Material not found.');
  }

  const file = await resolveFile(material, expectedType);
  const stat = await fs.promises.stat(file.path);
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      'Content-Type': file.contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(file.path).pipe(res);
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
    'Content-Type': file.contentType,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
  });
  fs.createReadStream(file.path, { start, end }).pipe(res);
}

export const streamMaterialVideoHandler = asyncHandler((req: Request, res: Response) =>
  streamMaterialFile(req, res, 'video')
);

export const streamMaterialPdfHandler = asyncHandler((req: Request, res: Response) =>
  streamMaterialFile(req, res, 'pdf')
);

export const streamMaterialAudioHandler = asyncHandler((req: Request, res: Response) =>
  streamMaterialFile(req, res, 'audio')
);
