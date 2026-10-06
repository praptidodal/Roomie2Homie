import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found handler for undefined routes
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404);
  next(error);
}

/**
 * Centralized error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  const response: {
    success: false;
    error: {
      message: string;
      statusCode: number;
      stack?: string;
    };
  } = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  // Only expose stack traces in development mode
  if (config.nodeEnv === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
