/**
 * Cache Service Test Suite
 * Tests performance caching layer with Cloudflare KV mocking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  withCache,
  createCacheService,
  type CacheOptions
} from './cache';

// Mock KVNamespace interface matching cache.ts expectations
interface MockKVNamespace {
  get(key: string): Promise<string | null>;
  get<T = unknown>(key: string, type: 'json'): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

describe('PerformanceCacheService', () => {
  let cache: ReturnType<typeof createCacheService>;
  let mockKV: MockKVNamespace;
  let cacheStorage: Map<string, string>;

  beforeEach(() => {
    cacheStorage = new Map();

    mockKV = {
      get: vi.fn(async (key: any, type?: any) => {
        const value = cacheStorage.get(key);
        if (type === 'json') {
          return value ? JSON.parse(value) : null;
        }
        return value || null;
      }),
      put: vi.fn(async (key: any, value: any, _options?: any) => {
        cacheStorage.set(key, value);
      }),
      delete: vi.fn(async (key: any) => {
        cacheStorage.delete(key);
      }),
      list: vi.fn(async (options?: any) => {
        const keys = Array.from(cacheStorage.keys());
        const filtered = options?.prefix
          ? keys.filter(k => k.startsWith(options.prefix))
          : keys;
        return {
          keys: filtered.map((name: any) => ({ name }))
        };
      })
    } as unknown as MockKVNamespace;

    cache = createCacheService(mockKV as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with KV namespace', () => {
      expect(cache).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return cached value when exists and valid', async () => {
      const key = 'test-key';
      const data = { message: 'hello' };

      await cache.set(key, data, { ttl: 60 });
      const result = await cache.get<typeof data>(key);

      expect(result).toEqual(data);
    });

    it('should return null when cache entry does not exist', async () => {
      const result = await cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should preserve type information for cached data', async () => {
      interface TestData {
        id: number;
        name: string;
        active: boolean;
      }

      const key = 'typed-key';
      const data: TestData = { id: 123, name: 'test', active: true };

      await cache.set(key, data);
      const result = await cache.get<TestData>(key);

      expect(result).toEqual(data);
      expect(result?.id).toBe(123);
      expect(result?.name).toBe('test');
      expect(result?.active).toBe(true);
    });
  });

  describe('set', () => {
    it('should store cache entry with TTL', async () => {
      const key = 'set-key';
      const data = { value: 42 };

      await cache.set(key, data, { ttl: 120 });

      expect(mockKV.put).toHaveBeenCalledWith(
        key,
        expect.stringContaining('"data"'),
        { expirationTtl: 120 }
      );
    });

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl-key';
      const data = { value: 'test' };

      await cache.set(key, data);

      expect(mockKV.put).toHaveBeenCalledWith(
        key,
        expect.any(String),
        { expirationTtl: 300 }
      );
    });

    it('should include cachedAt timestamp in entry', async () => {
      const key = 'timestamp-key';
      const data = { value: 1 };

      await cache.set(key, data);

      const putCall = (mockKV.put as any).mock.calls[0];
      const storedValue = JSON.parse(putCall[1]);

      expect(storedValue.cachedAt).toBeDefined();
      expect(typeof storedValue.cachedAt).toBe('number');
    });

    it('should include TTL in entry metadata', async () => {
      const key = 'metadata-key';
      const data = { value: 2 };
      const ttl = 60;

      await cache.set(key, data, { ttl });

      const putCall = (mockKV.put as any).mock.calls[0];
      const storedValue = JSON.parse(putCall[1]);

      expect(storedValue.ttl).toBe(ttl);
    });
  });

  describe('delete', () => {
    it('should delete cache entry', async () => {
      const key = 'delete-key';
      await mockKV.put(key, 'value');
      await cache.delete(key);

      expect(mockKV.delete).toHaveBeenCalledWith(key);
    });

    it('should handle deleting non-existent keys', async () => {
      await expect(cache.delete('non-existent')).resolves.not.toThrow();
      expect(mockKV.delete).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('generateKey', () => {
    it('should generate cache key from URL', () => {
      const url = '/api/data';
      const key = cache.generateKey(url);

      expect(key).toContain('cache:');
      expect(key).toContain(url);
    });

    it('should include params in cache key', () => {
      const url = '/api/search';
      const params = { q: 'test', page: 1 };
      const key = cache.generateKey(url, params);

      expect(key).toContain('cache:');
      expect(key).toContain(url);
      expect(key).toContain('q:test');
      expect(key).toContain('page:1');
    });

    it('should sort params for consistent key generation', () => {
      const url = '/api/data';
      const params1 = { b: 2, a: 1 };
      const params2 = { a: 1, b: 2 };

      const key1 = cache.generateKey(url, params1);
      const key2 = cache.generateKey(url, params2);

      expect(key1).toBe(key2);
    });

    it('should handle empty params', () => {
      const url = '/api/data';
      const key = cache.generateKey(url, {});

      expect(key).toContain('cache:');
      expect(key).toContain(url);
    });
  });

  describe('isCacheable', () => {
    it('should return true for GET requests on cacheable paths', () => {
      const request = new Request('https://example.com/api/templates');
      const isCacheable = cache.isCacheable(request);

      expect(isCacheable).toBe(true);
    });

    it('should return false for non-GET requests', () => {
      const request = new Request('https://example.com/api/data', { method: 'POST' });
      const isCacheable = cache.isCacheable(request);

      expect(isCacheable).toBe(false);
    });

    it('should return false for requests with no-cache header', () => {
      const headers = new Headers({ 'Cache-Control': 'no-cache' });
      const request = new Request('https://example.com/api/templates', { headers });
      const isCacheable = cache.isCacheable(request);

      expect(isCacheable).toBe(false);
    });

    it('should return false for non-cacheable paths', () => {
      const request = new Request('https://example.com/api/uncacheable');
      const isCacheable = cache.isCacheable(request);

      expect(isCacheable).toBe(false);
    });
  });

  describe('getTTLForPath', () => {
    it('should return appropriate TTL for templates', () => {
      const ttl = cache.getTTLForPath('/api/templates');
      expect(ttl).toBe(1800);
    });

    it('should return appropriate TTL for posts', () => {
      const ttl = cache.getTTLForPath('/api/posts');
      expect(ttl).toBe(600);
    });

    it('should return appropriate TTL for pages', () => {
      const ttl = cache.getTTLForPath('/api/pages');
      expect(ttl).toBe(3600);
    });

    it('should return default TTL for other paths', () => {
      const ttl = cache.getTTLForPath('/api/other');
      expect(ttl).toBe(300);
    });
  });

  describe('wrapResponse', () => {
    it('should wrap response with cache HIT header', async () => {
      const data = { message: 'cached' };
      const response = cache.wrapResponse(data, true);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
      expect(response.headers.get('X-Cache')).toBe('HIT');

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should wrap response with cache MISS header', async () => {
      const data = { message: 'fresh' };
      const response = cache.wrapResponse(data, false);

      expect(response.headers.get('X-Cache')).toBe('MISS');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });
  });
});

describe('withCache middleware', () => {
  let mockKV: MockKVNamespace;
  let cacheStorage: Map<string, string>;

  beforeEach(() => {
    cacheStorage = new Map();

    mockKV = {
      get: vi.fn(async (key: string, type?: string) => {
        const value = cacheStorage.get(key);
        if (!value) return null;

        if (type === 'json') {
          return JSON.parse(value);
        }
        return value;
      }),
      put: vi.fn(async (key: string, value: string, options?: { expirationTtl?: number }) => {
        cacheStorage.set(key, value);
      }),
      delete: vi.fn(async (key: string) => {
        cacheStorage.delete(key);
      }),
      list: vi.fn(async () => ({ keys: [] }))
    } as unknown as MockKVNamespace;
  });

  it('should fetch fresh data and cache it', async () => {
    const request = new Request('https://example.com/api/templates');
    const context = { env: { KV_CACHE: mockKV } };
    const freshData = { templates: [{ id: 1 }] };

    const handler = vi.fn().mockResolvedValue(freshData);
    const response = await withCache(request, context, handler, { ttl: 60 });

    expect(handler).toHaveBeenCalledOnce();
    expect(response.headers.get('X-Cache')).toBe('MISS');
  });

  it('should handle non-cacheable requests', async () => {
    const request = new Request('https://example.com/api/data', { method: 'POST' });
    const context = { env: { KV_CACHE: mockKV } };
    const data = { result: 'ok' };

    const handler = vi.fn().mockResolvedValue(data);
    const response = await withCache(request, context, handler);

    expect(handler).toHaveBeenCalledOnce();
    const body = await response.json();
    expect(body).toEqual(data);
  });

  it('should return error response when handler fails', async () => {
    const request = new Request('https://example.com/api/templates');
    const context = { env: { KV_CACHE: mockKV } };

    const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
    const response = await withCache(request, context, handler);

    expect(response.status).toBe(500);
  });

  it('should work without KV namespace (fallback mode)', async () => {
    const request = new Request('https://example.com/api/templates');
    const context = { env: {} };
    const data = { templates: [] };

    const handler = vi.fn().mockResolvedValue(data);
    const response = await withCache(request, context, handler);

    expect(handler).toHaveBeenCalledOnce();
    const body = await response.json();
    expect(body).toEqual(data);
  });
});

describe('createCacheService', () => {
  it('should create cache service instance', () => {
    const mockKV = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as MockKVNamespace;

    const service = createCacheService(mockKV as any);

    expect(service).toBeDefined();
    expect(service.get).toBeDefined();
    expect(service.set).toBeDefined();
    expect(service.delete).toBeDefined();
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle concurrent cache reads', async () => {
    const cacheStorage = new Map();

    const mockKV = {
      get: vi.fn(async (key: any, type?: any) => {
        const value = cacheStorage.get(key);
        if (type === 'json') {
          return value ? JSON.parse(value) : null;
        }
        return value || null;
      }),
      put: vi.fn(async (key: any, value: any, _options?: any) => {
        cacheStorage.set(key, value);
      }),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as MockKVNamespace;

    const cache = createCacheService(mockKV as any);

    await cache.set('concurrent-key', { value: 1 }, { ttl: 60 });

    const results = await Promise.all([
      cache.get('concurrent-key'),
      cache.get('concurrent-key'),
      cache.get('concurrent-key')
    ]);

    results.forEach((result: any) => {
      expect(result).toEqual({ value: 1 });
    });
  });

  it('should handle cache entries with complex nested objects', async () => {
    const cacheStorage = new Map();

    const mockKV = {
      get: vi.fn(async (key: string) => {
        const entry = cacheStorage.get(key);
        return entry ? JSON.parse(entry) : null;
      }),
      put: vi.fn(async (key: string, value: string) => {
        cacheStorage.set(key, value);
      }),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as MockKVNamespace;

    const cache = createCacheService(mockKV as any);

    const complexData = {
      nested: {
        deeply: {
          value: [1, 2, { test: true }]
        }
      },
      metadata: {
        timestamp: Date.now(),
        tags: ['tag1', 'tag2']
      }
    };

    await cache.set('complex-key', complexData);
    const result = await cache.get<typeof complexData>('complex-key');

    expect(result).toEqual(complexData);
    expect(result?.nested.deeply.value).toHaveLength(3);
  });

  it('should handle very long cache keys', async () => {
    const cacheStorage = new Map();

    const mockKV = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as MockKVNamespace;

    const cache = createCacheService(mockKV as any);

    const longUrl = '/api/' + 'x'.repeat(1000);
    const key = cache.generateKey(longUrl, { param: 'value' });

    expect(key).toBeDefined();
    expect(key.length).toBeGreaterThan(1000);
  });
});
