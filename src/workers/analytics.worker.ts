import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/config/queue';
import analyticsService from '@/services/analytics.service';
import logger from '@/config/logger';

export interface AnalyticsJobData {
  date: Date;
}

/**
 * Analytics Worker
 * Processes daily analytics aggregation jobs
 * Requirements: 7.5
 */
export const analyticsWorker = new Worker<AnalyticsJobData>(
  'analytics',
  async (job: Job<AnalyticsJobData>) => {
    const { date } = job.data;

    try {
      logger.info(`Starting analytics aggregation for ${date}`);

      // Aggregate daily analytics
      await analyticsService.aggregateDailyAnalytics(new Date(date));

      logger.info(`Completed analytics aggregation for ${date}`);

      return { success: true, date };
    } catch (error: any) {
      logger.error(`Failed to aggregate analytics for ${date}:`, error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process one aggregation at a time to avoid conflicts
    limiter: {
      max: 1,
      duration: 5000, // Max 1 job per 5 seconds
    },
  }
);

// Worker event handlers
analyticsWorker.on('completed', (job) => {
  logger.info(`Analytics job ${job.id} completed successfully`);
});

analyticsWorker.on('failed', (job, error) => {
  logger.error(`Analytics job ${job?.id} failed:`, error);
});

analyticsWorker.on('error', (error) => {
  logger.error('Analytics worker error:', error);
});

analyticsWorker.on('stalled', (jobId) => {
  logger.warn(`Analytics job ${jobId} stalled`);
});

// Graceful shutdown
export async function closeAnalyticsWorker(): Promise<void> {
  logger.info('Closing analytics worker...');
  await analyticsWorker.close();
  logger.info('Analytics worker closed');
}

process.on('SIGTERM', async () => {
  await closeAnalyticsWorker();
});

process.on('SIGINT', async () => {
  await closeAnalyticsWorker();
});

export default analyticsWorker;
