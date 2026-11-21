import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.logError(error, req);

  // Supabase/PostgreSQL errors
  if (err.code === '23505') {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23503') {
    const message = 'Foreign key constraint violation';
    error = { message, statusCode: 400 };
  }

  if (err.code === '23502') {
    const message = 'Required field missing';
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((error: any) => error.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && err.stack
        ? { stack: err.stack }
        : {})
    }
  });
};

// 404 Not Found middleware
export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

export const asyncHandler = (fn: AsyncRoute) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
