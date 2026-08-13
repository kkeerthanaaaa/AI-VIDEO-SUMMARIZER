import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { ALLOWED_VIDEO_MIME_TYPES, describeAllowedFormats } from '../utils/validators';

// Ensure upload directory exists
if (!fs.existsSync(env.uploadDir)) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(
      AppError.unsupportedMedia(
        `Unsupported video format "${file.mimetype}". Allowed formats: ${describeAllowedFormats()}.`,
        'UNSUPPORTED_FORMAT'
      ) as unknown as Error
    );
    return;
  }
  cb(null, true);
}

export const videoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxFileSizeBytes,
    files: 1,
  },
});
