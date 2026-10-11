import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { AppError } from './error.middleware';

// Ensure the upload directory exists
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');
const ROOMS_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'rooms');

if (!fs.existsSync(ROOMS_UPLOAD_DIR)) {
  fs.mkdirSync(ROOMS_UPLOAD_DIR, { recursive: true });
}

export const AVATARS_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'avatars');

if (!fs.existsSync(AVATARS_UPLOAD_DIR)) {
  fs.mkdirSync(AVATARS_UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types and safe extension map
const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ROOMS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate safe, unguessable filename: room-<timestamp>-<random-hex>.<ext>
    const safeExt = MIME_EXTENSION_MAP[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeFilename = `room-${Date.now()}-${randomHex}${safeExt}`;
    cb(null, safeFilename);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const isAllowed = Object.prototype.hasOwnProperty.call(MIME_EXTENSION_MAP, file.mimetype);
  if (isAllowed) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only JPG, JPEG, PNG, and WEBP image files are allowed.',
        400
      )
    );
  }
};

// 10 MB max file size, max 5 photos per listing
const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5,                   // Maximum 5 files
  },
});

const uploadArrayMiddleware = multerUpload.array('photos', 5);

/**
 * Middleware that handles multipart photo uploads for room creation.
 * If the request is not multipart/form-data, it gracefully passes through
 * so JSON requests continue to function seamlessly.
 */
export function uploadRoomPhotos(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  uploadArrayMiddleware(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError('Photo file size exceeds the 10 MB limit.', 400)
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new AppError('You can upload a maximum of 5 photos per listing.', 400)
          );
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      }
      return next(err);
    }
    next();
  });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATARS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate safe, unguessable filename: avatar-<timestamp>-<random-hex>.<ext>
    const safeExt = MIME_EXTENSION_MAP[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeFilename = `avatar-${Date.now()}-${randomHex}${safeExt}`;
    cb(null, safeFilename);
  },
});

const multerAvatarUpload = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per profile photo
    files: 1,                  // Exactly one profile photo
  },
});

const uploadSingleAvatar = multerAvatarUpload.single('avatar');

/**
 * Middleware that handles multipart photo upload for a user profile avatar.
 * Enforces single file, maximum 5 MB, and validated image MIME types.
 */
export function uploadAvatarPhoto(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  uploadSingleAvatar(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError('Profile photo exceeds the 5 MB limit.', 400)
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new AppError('Only one profile photo may be uploaded under the avatar field.', 400)
          );
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      }
      return next(err);
    }
    next();
  });
}
