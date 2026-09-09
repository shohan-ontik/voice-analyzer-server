import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { env } from './env';
import { UPLOAD_DIR } from '../utils/uploadPath';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_PREFIXES: Record<string, 'video' | 'audio' | 'pdf'> = {
  'video/': 'video',
  'audio/': 'audio',
  'application/pdf': 'pdf',
};

export function materialTypeForMimeType(mimeType: string): 'video' | 'audio' | 'pdf' | null {
  for (const [prefix, type] of Object.entries(ALLOWED_MIME_PREFIXES)) {
    if (mimeType.startsWith(prefix)) return type;
  }
  return null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname)}`),
});

export const uploadMaterialFile = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!materialTypeForMimeType(file.mimetype)) {
      cb(new Error('Unsupported file type — only video, audio, and PDF files are allowed.'));
      return;
    }
    cb(null, true);
  },
}).single('file');
