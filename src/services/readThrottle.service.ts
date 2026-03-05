import redis from '@/config/redis';
import logger from '@/config/logger';

/**
 * Read Throttle Service
 * Prevents duplicate read tracking when users refresh pages rapidly
 * 
 * Strategy: Use Redis to track recent reads with a time window
 * - Key format: `read:throttle:{articleId}:{userId|ip}`
 * - TTL: 60 seconds (configurable)
 * - If key exists, skip tracking
 * - If key doesn't exist, allow tracking and set key with TTL
 * 
 * This prevents the same user from generating 100 ReadLog entries in 10 seconds
 * while still allowing legitimate reads after the throttle window expires.
 */

export class ReadThrottleService {
  private readonly THROTTLE_WINDOW_SECONDS = 60; // 1 minute window
  private readonly KEY_PREFIX = 'read:throttle';

  /**
   * Check if a read should be tracked
   * Returns true if the read should be tracked, false if it should be throttled
   * 
   * @param articleId - The article being read
   * @param identifier - User ID or IP address
   * @returns Promise<boolean> - true if should track, false if throttled
   */
  async shouldTrackRead(articleId: string, identifier: string): Promise<boolean> {
    try {
      const key = this.generateKey(articleId, identifier);
      
      // Try to set the key with NX (only if not exists) and EX (expiration)
      // Returns 'OK' if key was set, null if key already exists
      const result = await redis.set(
        key,
        '1',
        'EX',
        this.THROTTLE_WINDOW_SECONDS,
        'NX'
      );

      // If result is 'OK', key was set (first read in window)
      // If result is null, key already exists (throttled)
      const shouldTrack = result === 'OK';

      if (!shouldTrack) {
        logger.debug(`Read throttled for article ${articleId} by ${identifier}`);
      }

      return shouldTrack;
    } catch (error) {
      // If Redis fails, allow the read to be tracked (fail open)
      // This ensures the feature doesn't break if Redis is down
      logger.error('Redis error in read throttle, allowing read:', error);
      return true;
    }
  }

  /**
   * Generate Redis key for read throttling
   * Format: read:throttle:{articleId}:{identifier}
   */
  private generateKey(articleId: string, identifier: string): string {
    return `${this.KEY_PREFIX}:${articleId}:${identifier}`;
  }

  /**
   * Get remaining throttle time for a read
   * Useful for debugging or showing users when they can read again
   * 
   * @param articleId - The article being read
   * @param identifier - User ID or IP address
   * @returns Promise<number> - Remaining seconds, or 0 if not throttled
   */
  async getRemainingThrottleTime(articleId: string, identifier: string): Promise<number> {
    try {
      const key = this.generateKey(articleId, identifier);
      const ttl = await redis.ttl(key);
      
      // TTL returns -2 if key doesn't exist, -1 if no expiration
      return ttl > 0 ? ttl : 0;
    } catch (error) {
      logger.error('Redis error getting throttle time:', error);
      return 0;
    }
  }

  /**
   * Manually clear throttle for a specific read
   * Useful for testing or admin operations
   * 
   * @param articleId - The article being read
   * @param identifier - User ID or IP address
   */
  async clearThrottle(articleId: string, identifier: string): Promise<void> {
    try {
      const key = this.generateKey(articleId, identifier);
      await redis.del(key);
      logger.debug(`Cleared throttle for article ${articleId} by ${identifier}`);
    } catch (error) {
      logger.error('Redis error clearing throttle:', error);
    }
  }

  /**
   * Get throttle statistics
   * Returns count of currently throttled reads
   * Useful for monitoring
   */
  async getThrottleStats(): Promise<{ activeThrottles: number }> {
    try {
      const pattern = `${this.KEY_PREFIX}:*`;
      let cursor = '0';
      let count = 0;

      // Use SCAN instead of KEYS to avoid blocking Redis in production
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        count += keys.length;
      } while (cursor !== '0');

      return { activeThrottles: count };
    } catch (error) {
      logger.error('Redis error getting throttle stats:', error);
      return { activeThrottles: 0 };
    }
  }
}

export default new ReadThrottleService();
