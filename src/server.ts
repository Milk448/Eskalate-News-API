import { createApp } from './app';
import { env } from './config/env';
import logger from './config/logger';
import prisma from './config/database';

// Import workers
import './workers/readLog.worker';
import './workers/analytics.worker';

// Import cron jobs
import { startAnalyticsCron } from './jobs/analytics.cron';

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✓ Database connected');

    // Create Express app
    const app = createApp();

    // Start server
    const PORT = parseInt(env.PORT, 10);
    const server = app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${env.NODE_ENV}`);
      logger.info(`✓ API available at http://localhost:${PORT}`);
    });

    // Start cron jobs
    startAnalyticsCron();
    logger.info('✓ Analytics cron job started');

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      // Close server
      server.close(async () => {
        logger.info('✓ HTTP server closed');

        // Close database connection
        await prisma.$disconnect();
        logger.info('✓ Database disconnected');

        // Close queues (handled by queue config)
        logger.info('✓ Queues closed');

        logger.info('✓ Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
