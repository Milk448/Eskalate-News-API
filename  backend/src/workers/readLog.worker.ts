import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/config/queue';
import prisma from '@/config/database';
import logger from '@/config/logger';
import { ReadEventData } from '@/services/readLog.service';

/**
 * Read Log Worker
 * Processes read events from the queue and inserts them into the database
 * Requirements: 6.4, 6.5, 12.5
 */
export const readLogWorker = new Worker<ReadEventData>(
  'read-log',
  async (job: Job<ReadEventData>) => {
    const { articleId, readerId, readAt } = job.data;

    try {
      // Insert read log entry
      await prisma.readLog.create({
        data: {
          articleId,
          readerId: readerId || null,
          readAt: new Date(readAt),
        },
      });

      logger.debug(`Read log created for article ${articleId}`);
      
      return { success: true, articleId };
    } catch (error: any) {
      logger.error(`Failed to create read log for article ${articleId}:`, error);
      
      // Check if it's a foreign key constraint error (article doesn't exist)
      if (error.code === 'P2003') {
        logger.warn(`Article ${articleId} not found, skipping read log`);
        // Don't retry for non-existent articles
        return { success: false, reason: 'article_not_found' };
      }
      
      // Rethrow for other errors to trigger retry
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10, // Process up to 10 jobs concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 1000, // Per second
    },
  }
);

// Worker event handlers
readLogWorker.on('completed', (job) => {
  logger.debug(`Read log job ${job.id} completed`);
});

readLogWorker.on('failed', (job, error) => {
  logger.error(`Read log job ${job?.id} failed:`, error);
});

readLogWorker.on('error', (error) => {
  logger.error('Read log worker error:', error);
});

// Graceful shutdown
export async function closeReadLogWorker(): Promise<void> {
  logger.info('Closing read log worker...');
  await readLogWorker.close();
  logger.info('Read log worker closed');
}

process.on('SIGTERM', async () => {
  await closeReadLogWorker();
});

process.on('SIGINT', async () => {
  await closeReadLogWorker();
});

export default readLogWorker;
