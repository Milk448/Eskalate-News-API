/**
 * Redis Client Configuration
 *
 * Creates and exports a singleton ioredis client used for two purposes in this
 * application:
 *
 * 1. **Read throttling** (`ReadThrottleService`) – short-lived keys are stored
 *    here to prevent the same reader from generating duplicate `ReadLog` entries
 *    within a 60-second window.
 *
 * 2. **BullMQ transport** – BullMQ uses a *separate* ioredis-compatible
 *    connection defined in `config/queue.ts`; that config re-uses the same host
 *    and port but creates its own connection because BullMQ requires
 *    `maxRetriesPerRequest: null`.
 *
 * Connection lifecycle events (connect / error / close) are forwarded to
 * Winston so infrastructure issues are visible in the application logs.
 */
import Redis from 'ioredis';
import logger from './logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redis.on('close', () => {
  logger.info('Redis connection closed');
});

export default redis;
