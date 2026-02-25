import cron from 'node-cron';
import { analyticsQueue } from '@/config/queue';
import logger from '@/config/logger';

/**
 * Daily Analytics Aggregation Cron Job
 * Runs at midnight GMT every day
 * Queues aggregation job for the previous day
 * Requirements: 7.1, 7.2
 */
export function startAnalyticsCron(): cron.ScheduledTask {
  // Run at midnight GMT (00:00) every day
  const task = cron.schedule(
    '0 0 * * *',
    async () => {
      try {
        // Get yesterday's date in GMT
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        yesterday.setUTCHours(0, 0, 0, 0);

        logger.info(`Scheduling analytics aggregation for ${yesterday.toISOString().split('T')[0]}`);

        // Queue the aggregation job
        await analyticsQueue.add(
          'aggregate-daily',
          { date: yesterday },
          {
            priority: 1, // High priority
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
        );

        logger.info('Analytics aggregation job queued successfully');
      } catch (error) {
        logger.error('Failed to queue analytics aggregation job:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'GMT',
    }
  );

  logger.info('Analytics cron job started (runs daily at midnight GMT)');

  return task;
}

/**
 * Manually trigger analytics aggregation for a specific date
 * Useful for backfilling or testing
 */
export async function triggerAnalyticsAggregation(date: Date): Promise<void> {
  try {
    // Ensure date is in GMT
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    logger.info(`Manually triggering analytics aggregation for ${targetDate.toISOString().split('T')[0]}`);

    await analyticsQueue.add(
      'aggregate-daily',
      { date: targetDate },
      {
        priority: 1,
        attempts: 5,
      }
    );

    logger.info('Manual analytics aggregation job queued successfully');
  } catch (error) {
    logger.error('Failed to manually trigger analytics aggregation:', error);
    throw error;
  }
}

/**
 * Backfill analytics for a date range
 * Useful for historical data processing
 */
export async function backfillAnalytics(startDate: Date, endDate: Date): Promise<void> {
  try {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);

    logger.info(`Backfilling analytics from ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);

    const jobs = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      jobs.push({
        name: 'aggregate-daily',
        data: { date: new Date(currentDate) },
        opts: {
          priority: 5, // Lower priority for backfill
          attempts: 3,
        },
      });

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    await analyticsQueue.addBulk(jobs);

    logger.info(`Queued ${jobs.length} analytics aggregation jobs for backfill`);
  } catch (error) {
    logger.error('Failed to backfill analytics:', error);
    throw error;
  }
}

export default {
  startAnalyticsCron,
  triggerAnalyticsAggregation,
  backfillAnalytics,
};
