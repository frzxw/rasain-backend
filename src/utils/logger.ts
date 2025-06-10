import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += '\n' + JSON.stringify(meta, null, 2);
    }
    
    return log;
  })
);

// Create the logger
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'rasain-api' },
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  winstonLogger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Extended logger interface
interface ExtendedLogger extends winston.Logger {
  logRequest: (req: Request, res: Response, responseTime: number) => void;
  logError: (error: Error, req?: Request | null) => void;
  logDatabase: (operation: string, table: string, data?: any) => void;
  logAuth: (action: string, userId?: string | null, details?: Record<string, any>) => void;
}

// Add custom methods for structured logging
const extendedLogger = winstonLogger as ExtendedLogger;

extendedLogger.logRequest = (req: Request, res: Response, responseTime: number): void => {
  winstonLogger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
};

extendedLogger.logError = (error: Error, req: Request | null = null): void => {
  const errorData: Record<string, any> = {
    message: error.message,
    stack: error.stack,
  };

  if (req) {
    errorData.method = req.method;
    errorData.url = req.url;
    errorData.headers = req.headers;
    errorData.body = req.body;
  }
  
  winstonLogger.error('Application Error', errorData);
};

extendedLogger.logDatabase = (operation: string, table: string, data: any = null): void => {
  winstonLogger.debug('Database Operation', {
    operation,
    table,
    data: data ? JSON.stringify(data) : null
  });
};

extendedLogger.logAuth = (action: string, userId: string | null = null, details: Record<string, any> = {}): void => {
  winstonLogger.info('Authentication Event', {
    action,
    userId,
    ...details
  });
};

// Custom error class for application errors
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Export logger for scripts
export const logger = extendedLogger;

export default extendedLogger;
