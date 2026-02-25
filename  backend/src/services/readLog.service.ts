import { readLogQueue } from '@/config/queue';
import logger from '@/config/logger';
import readThrottleService from '@/services/readThrottle.service';

export interface ReadEventData {
  articleId: string;
  readerId?: string;
  readAt: Date;
}

/**
 * ReadLog Service
 * Handles asynchronous read tracking with duplicate prevention
 * 
 * Implements Redis-based throttling to prevent the same user from
 * generating 100 ReadLog entries in 10 seconds by refreshing the page
 */
export class ReadLogService {
  /**
   * Record a read event asynchronously
   * Queues the event for processing without blocking the response
   * Implements throttling to prevent duplicate reads within 60 seconds
   * 
   * Requirements: 6.3, 6.4, 6.5, 12.2
   * Bonus: Duplicate read prevention
   * 
   * @param articleId - The article being read
   * @param readerId - User ID (optional, null for guest reads)
   * @param ipAddress - IP address for guest throttling (optional)
   */
  async recordRead(articleId: string, readerId?: string, ipAddress?: string): Promise<void> {
    try {
      // Determine identifier for throttling (userId or IP)
      const identifier = readerId || ipAddress || 'anonymous';

      // Check if read should be throttled (prevents duplicate reads)
      const shouldTrack = await readThrottleService.shouldTrackRead(articleId, identifier);

      if (!shouldTrack) {
        logger.debug(`Read throttled for article ${articleId} by ${identifier}`);
        return; // Skip tracking this read
      }

      const eventData: ReadEventData = {
        articleId,
        readerId,
        readAt: new Date(),
      };

      // Add job to queue (fire-and-forget)
      await readLogQueue.add('track-read', eventData, {
        priority: 10, // Lower priority than critical jobs
      });

      logger.debug(`Read event queued for article ${articleId} by ${identifier}`);
    } catch (error) {
      // Log error but don't throw - read tracking failures should not affect article retrieval
      logger.error('Failed to queue read event:', error);
    }
  }

  /**
   * Record multiple read events in batch
   * Useful for bulk operations or testing
   */
  async recordReadBatch(events: ReadEventData[]): Promise<void> {
    try {
      const jobs = events.map((event) => ({
        name: 'track-read',
        data: event,
        opts: {
          priority: 10,
        },
      }));

      await readLogQueue.addBulk(jobs);

      logger.debug(`${events.length} read events queued`);
    } catch (error) {
      logger.error('Failed to queue read events batch:', error);
    }
  }

  /**
   * Get queue statistics
   * Useful for monitoring and debugging
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      readLogQueue.getWaitingCount(),
      readLogQueue.getActiveCount(),
      readLogQueue.getCompletedCount(),
      readLogQueue.getFailedCount(),
      readLogQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Pause the queue
   * Useful for maintenance or debugging
   */
  async pauseQueue(): Promise<void> {
    await readLogQueue.pause();
    logger.info('Read log queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await readLogQueue.resume();
    logger.info('Read log queue resumed');
  }

  /**
   * Clear all jobs from the queue
   * Use with caution - only for testing/development
   */
  async clearQueue(): Promise<void> {
    await readLogQueue.drain();
    await readLogQueue.clean(0, 1000, 'completed');
    await readLogQueue.clean(0, 1000, 'failed');
    logger.warn('Read log queue cleared');
  }
}

export default new ReadLogService();
