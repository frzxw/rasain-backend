import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from '@/utils/logger';

// RATE_LIMIT_WINDOW_MS is milliseconds. rate-limiter-flexible wants seconds.
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const windowSeconds = Math.max(1, Math.round((Number.isFinite(windowMs) ? windowMs : 900000) / 1000));

const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  duration: windowSeconds
});

// Middleware function
const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await rateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      retryAfter: secs
    });
    
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      error: {
        message: 'Too many requests, please try again later',
        retryAfter: secs
      }
    });
  }
};

export default rateLimiterMiddleware;
