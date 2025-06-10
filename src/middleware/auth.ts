import { Request, Response, NextFunction } from 'express';
import { getAuthenticatedUser } from '@/config/database';
import { AppError } from './errorMiddleware';
import logger from '@/utils/logger';

// Remove unused import
// import { AuthenticatedUser } from '@/types';

// Protect routes - require authentication
export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      return next(new AppError('Not authorized, token required', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    logger.logAuth('auth_failed', null, { error: (error as Error).message });
    next(new AppError('Not authorized, token invalid', 401));
  }
};

// Optional auth - get user if token exists but don't require it
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getAuthenticatedUser(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

// Admin only access
export const adminOnly = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }

  if (req.user.user_metadata?.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }

  next();
};

// Check if user owns resource or is admin
export const ownerOrAdmin = (userIdField: string = 'user_id') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }

    const isAdmin = req.user.user_metadata?.role === 'admin';
    const isOwner = req.body[userIdField] === req.user.id || 
                   req.params[userIdField] === req.user.id ||
                   req.params.userId === req.user.id;

    if (!isAdmin && !isOwner) {
      return next(new AppError('Access denied', 403));
    }

    next();
  };
};

// Add auth export for backward compatibility
export const auth = protect;
