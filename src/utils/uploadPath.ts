import path from 'path';
import { env } from '../config/env';

// Resolved relative to this file (repo_root/src/utils/uploadPath.ts) rather
// than process.cwd(), so it's correct regardless of where the process was
// started from — matching how the demo files in media.controller.ts already
// resolve their paths.
export const UPLOAD_DIR = path.join(__dirname, '../..', env.UPLOAD_DIR);
