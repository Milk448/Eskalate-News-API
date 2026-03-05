import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import articleRoutes from './routes/article.routes';
import dashboardRoutes from './routes/dashboard.routes';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Request logging
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // API routes
  app.use('/auth', authRoutes);
  app.use('/articles', articleRoutes);
  app.use('/author', dashboardRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      Success: false,
      Message: 'Endpoint not found',
      Object: null,
      Errors: ['The requested endpoint does not exist'],
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp();
