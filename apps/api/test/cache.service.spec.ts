import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../common/services/cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      store: {
        keys: jest.fn(),
        clear: jest.fn(),
        getStats: jest.fn(),
      },
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const defaults = {
          ENABLE_CACHE: true,
          CACHE_TTL: 3600,
          REDIS_HOST: 'localhost',
          REDIS_PORT: 6379,
        };
        return defaults[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCacheManager,
        },
        {
          provide: 'ConfigService',
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when found', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });

    it('should return undefined when cache miss', async () => {
      const key = 'test-key';
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get(key);

      expect(result).toBeUndefined();
    });

    it('should not cache when ENABLE_CACHE is false', async () => {
      mockConfigService.get.mockReturnValue(false);
      const result = await service.get('test-key');

      expect(result).toBeUndefined();
      expect(mockCacheManager.get).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should cache value with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, 1800);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, 1800000); // 1800s * 1000ms
    });

    it('should use default TTL when not provided', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, 3600000); // 3600s * 1000ms
    });
  });

  describe('generateKey', () => {
    it('should generate key without organization', () => {
      const key = service.generateKey('projects', 'list');
      expect(key).toBe('projects:list');
    });

    it('should generate key with organization', () => {
      const key = service.generateKey('projects', 'list', 'org-123');
      expect(key).toBe('projects:list:org:org-123');
    });
  });

  describe('generateUserKey', () => {
    it('should generate user-specific key', () => {
      const key = service.generateUserKey('dashboard', 'user-123', 'org-456');
      expect(key).toBe('dashboard:user:user-123:org:org-456');
    });
  });

  describe('generateProjectKey', () => {
    it('should generate project-specific key', () => {
      const key = service.generateProjectKey(
        'detail',
        'project-123',
        'org-456'
      );
      expect(key).toBe('detail:project:project-123:org:org-456');
    });
  });

  describe('invalidatePattern', () => {
    it('should invalidate keys matching pattern', async () => {
      const pattern = 'projects:*';
      const keys = ['projects:list:org:123', 'projects:detail:org:123'];

      mockCacheManager.store.keys.mockResolvedValue(keys);
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.invalidatePattern(pattern);

      expect(mockCacheManager.store.keys).toHaveBeenCalledWith(pattern);
      expect(mockCacheManager.del).toHaveBeenCalledTimes(keys.length);
    });
  });
});
