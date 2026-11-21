import '@/config/loadEnv';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';

// Import middleware and routes
import { errorHandler, notFound } from '@/middleware/errorMiddleware';
import rateLimiter from '@/middleware/rateLimiter';
import logger from '@/utils/logger';
import { initializeDatabase } from '@/config/database';

// Import route modules
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import recipeRoutes from '@/routes/recipes';
import pantryRoutes from '@/routes/pantry';
import communityRoutes from '@/routes/community';
import chatRoutes from '@/routes/chat';
import notificationRoutes from '@/routes/notifications';
import uploadRoutes from '@/routes/upload';

const app: Application = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Rasain API Server is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
const apiVersion: string = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/recipes`, recipeRoutes);
app.use(`/api/${apiVersion}/pantry`, pantryRoutes);
app.use(`/api/${apiVersion}/community`, communityRoutes);
app.use(`/api/${apiVersion}/chat`, chatRoutes);
app.use(`/api/${apiVersion}/notifications`, notificationRoutes);
app.use(`/api/${apiVersion}/upload`, uploadRoutes);

// Welcome route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Rasain API - Indonesian Recipe & Cooking Assistant',
    version: process.env.API_VERSION || 'v1',
    documentation: `/api/${apiVersion}/docs`,
    endpoints: {
      auth: `/api/${apiVersion}/auth`,
      users: `/api/${apiVersion}/users`,
      recipes: `/api/${apiVersion}/recipes`,
      pantry: `/api/${apiVersion}/pantry`,
      community: `/api/${apiVersion}/community`,
      chat: `/api/${apiVersion}/chat`,
      notifications: `/api/${apiVersion}/notifications`,
      upload: `/api/${apiVersion}/upload`
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection
    await initializeDatabase();
    
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        logger.info(`🚀 Rasain API Server running on port ${PORT}`);
        logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
        logger.info(`📖 API Documentation: http://localhost:${PORT}/api/${apiVersion}`);
        logger.info(`💾 Database: Connected to Supabase`);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
