/**
 * Custom application error with an HTTP status code and a stable error
 * code that the frontend can use to show user-friendly messages.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }

  static notFound(message: string, code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }

  static tooLarge(message: string, code = 'FILE_TOO_LARGE') {
    return new AppError(message, 413, code);
  }

  static unsupportedMedia(message: string, code = 'UNSUPPORTED_FORMAT') {
    return new AppError(message, 415, code);
  }

  static tooManyRequests(message: string, code = 'RATE_LIMITED') {
    return new AppError(message, 429, code);
  }

  static upstream(message: string, code = 'GEMINI_ERROR') {
    return new AppError(message, 502, code);
  }
}
