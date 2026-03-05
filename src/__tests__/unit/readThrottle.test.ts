import { ReadThrottleService } from '@/services/readThrottle.service';

// Mock Redis
jest.mock('@/config/redis', () => ({
  __esModule: true,
  default: {
    set: jest.fn(),
    ttl: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
  },
}));

import redis from '@/config/redis';

describe('ReadThrottleService', () => {
  let service: ReadThrottleService;
  const mockRedis = redis as jest.Mocked<typeof redis>;

  beforeEach(() => {
    service = new ReadThrottleService();
    jest.clearAllMocks();
  });

  describe('shouldTrackRead', () => {
    it('should allow first read within window', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      const result = await service.shouldTrackRead('article-123', 'user-456');

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'read:throttle:article-123:user-456',
        '1',
        'EX',
        60,
        'NX'
      );
    });

    it('should throttle duplicate read within window', async () => {
      mockRedis.set.mockResolvedValue(null);

      const result = await service.shouldTrackRead('article-123', 'user-456');

      expect(result).toBe(false);
    });

    it('should use IP address for anonymous users', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      const result = await service.shouldTrackRead('article-123', '192.168.1.1');

      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'read:throttle:article-123:192.168.1.1',
        '1',
        'EX',
        60,
        'NX'
      );
    });

    it('should fail open if Redis is down', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));

      const result = await service.shouldTrackRead('article-123', 'user-456');

      expect(result).toBe(true); // Allow read even if Redis fails
    });
  });

  describe('getRemainingThrottleTime', () => {
    it('should return remaining TTL for throttled read', async () => {
      mockRedis.ttl.mockResolvedValue(45);

      const result = await service.getRemainingThrottleTime('article-123', 'user-456');

      expect(result).toBe(45);
      expect(mockRedis.ttl).toHaveBeenCalledWith('read:throttle:article-123:user-456');
    });

    it('should return 0 if key does not exist', async () => {
      mockRedis.ttl.mockResolvedValue(-2);

      const result = await service.getRemainingThrottleTime('article-123', 'user-456');

      expect(result).toBe(0);
    });

    it('should return 0 if key has no expiration', async () => {
      mockRedis.ttl.mockResolvedValue(-1);

      const result = await service.getRemainingThrottleTime('article-123', 'user-456');

      expect(result).toBe(0);
    });

    it('should return 0 if Redis fails', async () => {
      mockRedis.ttl.mockRejectedValue(new Error('Redis error'));

      const result = await service.getRemainingThrottleTime('article-123', 'user-456');

      expect(result).toBe(0);
    });
  });

  describe('clearThrottle', () => {
    it('should delete throttle key', async () => {
      mockRedis.del.mockResolvedValue(1);

      await service.clearThrottle('article-123', 'user-456');

      expect(mockRedis.del).toHaveBeenCalledWith('read:throttle:article-123:user-456');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.clearThrottle('article-123', 'user-456')).resolves.not.toThrow();
    });
  });

  describe('getThrottleStats', () => {
    it('should return count of active throttles', async () => {
      // Mock scan to return all keys in one batch (cursor '0' means done)
      mockRedis.scan.mockResolvedValue([
        '0',
        [
          'read:throttle:article-1:user-1',
          'read:throttle:article-2:user-2',
          'read:throttle:article-3:user-3',
        ],
      ] as any);

      const result = await service.getThrottleStats();

      expect(result.activeThrottles).toBe(3);
      expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'read:throttle:*', 'COUNT', 100);
    });

    it('should return 0 if Redis fails', async () => {
      mockRedis.scan.mockRejectedValue(new Error('Redis error'));

      const result = await service.getThrottleStats();

      expect(result.activeThrottles).toBe(0);
    });
  });

  describe('Throttle Window', () => {
    it('should use 60 second window by default', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      await service.shouldTrackRead('article-123', 'user-456');

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        '1',
        'EX',
        60, // 60 seconds
        'NX'
      );
    });
  });

  describe('Key Generation', () => {
    it('should generate consistent keys for same article and user', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      await service.shouldTrackRead('article-123', 'user-456');
      await service.shouldTrackRead('article-123', 'user-456');

      const calls = mockRedis.set.mock.calls;
      expect(calls[0][0]).toBe(calls[1][0]);
      expect(calls[0][0]).toBe('read:throttle:article-123:user-456');
    });

    it('should generate different keys for different articles', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      await service.shouldTrackRead('article-123', 'user-456');
      await service.shouldTrackRead('article-789', 'user-456');

      const calls = mockRedis.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
    });

    it('should generate different keys for different users', async () => {
      mockRedis.set.mockResolvedValue('OK' as any);

      await service.shouldTrackRead('article-123', 'user-456');
      await service.shouldTrackRead('article-123', 'user-789');

      const calls = mockRedis.set.mock.calls;
      expect(calls[0][0]).not.toBe(calls[1][0]);
    });
  });
});
