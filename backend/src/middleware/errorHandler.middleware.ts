import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { describeAllowedFormats } from '../utils/validators';

/**
 * Catches 404s for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
    },
  });
}

/**
 * Centralized error handler. Converts known error types into a consistent
 * { error: { message, code } } JSON shape with an appropriate HTTP status.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Multer-specific errors (file too large, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    let message = 'There was a problem with the uploaded file.';
    let code = err.code;
    let statusCode = 400;

    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'The uploaded video is too large.';
      statusCode = 413;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unsupported file. Allowed formats: ${describeAllowedFormats()}.`;
    }

    res.status(statusCode).json({ error: { message, code } });
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, err);
    }
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
    return;
  }

  const error = err as Error;
  logger.error('Unhandled error', error);
  res.status(500).json({
    error: {
      message: 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
    },
  });
}
