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

// Soft delete middleware - automatically filter out deleted records for public-facing queries.
// NOTE: This globally intercepts findUnique and findMany on Article models. Repository-layer
// queries that need to include deleted records should use findFirst with explicit deletedAt
// conditions instead of findUnique, or pass { deletedAt: undefined } to bypass this filter.
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
