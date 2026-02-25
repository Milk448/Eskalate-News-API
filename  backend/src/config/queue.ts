import { Queue, QueueEvents } from 'bullmq';
import { env } from './env';
import logger from './logger';

/**
 * Redis connection configuration for BullMQ
 */
export const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
};

/**
 * Read Log Queue
 * Handles asynchronous read event tracking
 * Requirements: 6.3, 12.1
 */
export const readLogQueue = new Queue('read-log', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Keep for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs for debugging
    },
  },
});

/**
 * Analytics Queue
 * Handles daily analytics aggregation
 * Requirements: 7.5
 */
export const analyticsQueue = new Queue('analytics', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 50,
      age: 7 * 24 * 3600, // Keep for 7 days
    },
    removeOnFail: {
      count: 100,
    },
  },
});

/**
 * Queue Events for monitoring
 */
export const readLogQueueEvents = new QueueEvents('read-log', {
  connection: redisConnection,
});

export const analyticsQueueEvents = new QueueEvents('analytics', {
  connection: redisConnection,
});

// Log queue events
readLogQueueEvents.on('completed', ({ jobId }) => {
  logger.debug(`Read log job ${jobId} completed`);
});

readLogQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Read log job ${jobId} failed: ${failedReason}`);
});

analyticsQueueEvents.on('completed', ({ jobId }) => {
  logger.info(`Analytics job ${jobId} completed`);
});

analyticsQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Analytics job ${jobId} failed: ${failedReason}`);
});

/**
 * Graceful shutdown
 */
export async function closeQueues(): Promise<void> {
  logger.info('Closing queues...');
  
  await readLogQueue.close();
  await analyticsQueue.close();
  await readLogQueueEvents.close();
  await analyticsQueueEvents.close();
  
  logger.info('Queues closed');
}

// Handle process termination
process.on('SIGTERM', async () => {
  await closeQueues();
});

process.on('SIGINT', async () => {
  await closeQueues();
});

export default {
  readLogQueue,
  analyticsQueue,
  readLogQueueEvents,
  analyticsQueueEvents,
  closeQueues,
};
