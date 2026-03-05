/**
 * Database Configuration
 *
 * Creates and exports a singleton PrismaClient instance used throughout the application
 * to interact with the PostgreSQL database.
 *
 * Key behaviours:
 * - In development mode all SQL queries and their durations are logged via Winston.
 * - A Prisma middleware intercepts every `Article` query and automatically appends
 *   `deletedAt: null` so that soft-deleted articles are transparent to the rest of
 *   the codebase (i.e. code never sees deleted records unless it explicitly asks for
 *   them by passing `deletedAt` in the where clause).
 * - The connection is closed gracefully when the Node.js process is about to exit.
 */
import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

// Soft delete middleware - automatically filter out deleted records
prisma.$use(async (params, next) => {
  if (params.model === 'Article') {
    // For findUnique, convert to findFirst with deletedAt filter
    if (params.action === 'findUnique') {
      params.action = 'findFirst';
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }

    // For findMany, add deletedAt filter if not explicitly set
    if (params.action === 'findMany') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      } else {
        params.args.where = { deletedAt: null };
      }
    }
  }

  return next(params);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
});

export default prisma;
