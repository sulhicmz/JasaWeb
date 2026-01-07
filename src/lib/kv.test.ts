/**
 * KV Cache Service Test Suite
 * Tests Cloudflare KV cache service utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheGetOrSet,
  cacheInvalidateByPrefix,
  CacheKeys
} from './kv';
import type { KVNamespace } from './types';

describe('KV Cache Service', () => {
  let mockKV: KVNamespace;
  let cacheStorage: Map<string, { value: string; expiration?: number }>;

  beforeEach(() => {
    cacheStorage = new Map();

    mockKV = {
      get: vi.fn(async (key: any, type?: any) => {
        const entry = cacheStorage.get(key);
        if (!entry) return null;

        if (type === 'json') {
          return JSON.parse(entry.value);
        }
        return entry.value;
      }),
      put: vi.fn(async (key: any, value: any, options?: any) => {
        cacheStorage.set(key, { value, expiration: options?.expirationTtl });
      }),
      delete: vi.fn(async (key: any) => {
        cacheStorage.delete(key);
      }),
      list: vi.fn(async (options?: any) => {
        const keys = Array.from(cacheStorage.keys());
        const filtered = options?.prefix
          ? keys.filter((k: any) => k.startsWith(options.prefix))
          : keys;
        return {
          keys: filtered.map((name: any) => ({ name })),
          list_complete: true,
          cursor: ''
        };
      })
    } as unknown as KVNamespace;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('cacheGet', () => {
    it('should retrieve cached value by key', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await mockKV.put(key, JSON.stringify(value));
      const result = await cacheGet(mockKV, key);

      expect(result).toEqual(value);
      expect(mockKV.get).toHaveBeenCalledWith(key, 'json');
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheGet(mockKV, 'non-existent-key');
      expect(result).toBeNull();
    });

    it('should return typed values correctly', async () => {
      const key = 'object-key';
      const data = { id: 123, name: 'test' };

      await mockKV.put(key, JSON.stringify(data));
      const result = await cacheGet<typeof data>(mockKV, key);

      expect(result).toEqual(data);
    });
  });

  describe('cacheSet', () => {
    it('should set cached value with default TTL', async () => {
      const key = 'set-key';
      const value = 'set-value';

      await cacheSet(mockKV, key, value);

      expect(mockKV.put).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        { expirationTtl: 3600 }
      );
    });

    it('should set cached value with custom TTL', async () => {
      const key = 'custom-ttl-key';
      const value = 'custom-value';
      const options = { ttl: 1800 };

      await cacheSet(mockKV, key, value, options);

      expect(mockKV.put).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        { expirationTtl: 1800 }
      );
    });

    it('should store complex objects', async () => {
      const key = 'object-key';
      const data = { nested: { value: 123 } };

      await cacheSet(mockKV, key, data);

      expect(mockKV.put).toHaveBeenCalledWith(
        key,
        JSON.stringify(data),
        expect.any(Object)
      );
    });
  });

  describe('cacheDelete', () => {
    it('should delete cached value', async () => {
      const key = 'delete-key';
      await mockKV.put(key, 'value');

      await cacheDelete(mockKV, key);

      expect(mockKV.delete).toHaveBeenCalledWith(key);
    });

    it('should handle deleting non-existent keys', async () => {
      await expect(cacheDelete(mockKV, 'non-existent')).resolves.not.toThrow();
      expect(mockKV.delete).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('cacheGetOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'get-or-set-key';
      const cachedValue = 'cached';
      const fetcher = vi.fn().mockResolvedValue('fresh');

      await mockKV.put(key, JSON.stringify(cachedValue), { expirationTtl: 3600 });
      const result = await cacheGetOrSet(mockKV, key, fetcher);

      expect(result).toBe(cachedValue);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache new value if not exists', async () => {
      const key = 'new-key';
      const freshValue = 'fresh-value';
      const fetcher = vi.fn().mockResolvedValue(freshValue);

      const result = await cacheGetOrSet(mockKV, key, fetcher);

      expect(result).toBe(freshValue);
      expect(fetcher).toHaveBeenCalledOnce();
      expect(mockKV.put).toHaveBeenCalledWith(
        key,
        JSON.stringify(freshValue),
        { expirationTtl: 3600 }
      );
    });

    it('should use custom TTL when provided', async () => {
      const key = 'custom-ttl-key';
      const fetcher = vi.fn().mockResolvedValue('value');

      await cacheGetOrSet(mockKV, key, fetcher, { ttl: 900 });

      expect(mockKV.put).toHaveBeenCalledWith(
        key,
        JSON.stringify('value'),
        { expirationTtl: 900 }
      );
    });

    it('should handle fetcher errors gracefully', async () => {
      const key = 'error-key';
      const fetcher = vi.fn().mockRejectedValue(new Error('Fetch failed'));

      await expect(cacheGetOrSet(mockKV, key, fetcher)).rejects.toThrow('Fetch failed');
      expect(fetcher).toHaveBeenCalledOnce();
    });
  });

  describe('cacheInvalidateByPrefix', () => {
    beforeEach(() => {
      cacheStorage.clear();

      mockKV = {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(async (key: any) => {
          cacheStorage.delete(key);
        }),
        list: vi.fn(async (options?: any) => {
          const allKeys = Array.from(cacheStorage.keys());

          if (!options?.prefix) {
            return {
              keys: allKeys.map((name: any) => ({ name })),
              list_complete: true,
              cursor: ''
            };
          }

          const filtered = allKeys.filter((k: any) => k.startsWith(options.prefix));
          return {
            keys: filtered.map((name: any) => ({ name })),
            list_complete: true,
            cursor: ''
          };
        })
      } as unknown as KVNamespace;

      cacheStorage.set('templates:all', { value: 'all-templates' });
      cacheStorage.set('templates:featured', { value: 'featured-templates' });
      cacheStorage.set('posts:recent', { value: 'recent-posts' });
      cacheStorage.set('users:123', { value: 'user-123' });
    });

    it('should delete all keys with matching prefix', async () => {
      await cacheInvalidateByPrefix(mockKV, 'templates:');

      expect(mockKV.delete).toHaveBeenCalledTimes(2);
      expect(mockKV.delete).toHaveBeenCalledWith('templates:all');
      expect(mockKV.delete).toHaveBeenCalledWith('templates:featured');
    });

    it('should only delete matching keys', async () => {
      await cacheInvalidateByPrefix(mockKV, 'templates:');

      expect(cacheStorage.has('posts:recent')).toBe(true);
      expect(cacheStorage.has('users:123')).toBe(true);
      expect(cacheStorage.has('templates:all')).toBe(false);
    });

    it('should handle empty prefix (delete all)', async () => {
      await cacheInvalidateByPrefix(mockKV, '');

      expect(mockKV.delete).toHaveBeenCalledTimes(4);
    });

    it('should handle non-existent prefix', async () => {
      await cacheInvalidateByPrefix(mockKV, 'nonexistent:');

      expect(mockKV.delete).not.toHaveBeenCalled();
    });
  });

  describe('CacheKeys', () => {
    describe('templates', () => {
      it('should generate key for all templates', () => {
        const key = CacheKeys.templates();
        expect(key).toBe('templates:all');
      });

      it('should generate key for templates by category', () => {
        const key = CacheKeys.templatesByCategory('business');
        expect(key).toBe('templates:business');
      });
    });

    describe('posts', () => {
      it('should generate key for all posts', () => {
        const key = CacheKeys.posts();
        expect(key).toBe('posts:all');
      });

      it('should generate key for post by slug', () => {
        const key = CacheKeys.postBySlug('my-first-post');
        expect(key).toBe('posts:my-first-post');
      });
    });

    describe('pages', () => {
      it('should generate key for all pages', () => {
        const key = CacheKeys.pages();
        expect(key).toBe('pages:all');
      });

      it('should generate key for page by slug', () => {
        const key = CacheKeys.pageBySlug('about');
        expect(key).toBe('pages:about');
      });
    });

    describe('users', () => {
      it('should generate key for user by ID', () => {
        const key = CacheKeys.user('user123');
        expect(key).toBe('users:user123');
      });
    });

    describe('projects', () => {
      it('should generate key for user projects', () => {
        const key = CacheKeys.projects('user456');
        expect(key).toBe('projects:user456');
      });
    });
  });
});

describe('Integration Tests', () => {
  let mockKV: KVNamespace;
  let cacheStorage: Map<string, { value: string; expiration?: number }>;

  beforeEach(() => {
    cacheStorage = new Map();

    mockKV = {
      get: vi.fn(async (key: any, type?: any) => {
        const entry = cacheStorage.get(key);
        if (!entry) return null;

        if (type === 'json') {
          return JSON.parse(entry.value);
        }
        return entry.value;
      }),
      put: vi.fn(async (key: any, value: any, options?: any) => {
        cacheStorage.set(key, { value, expiration: options?.expirationTtl });
      }),
      delete: vi.fn(async (key: any) => {
        cacheStorage.delete(key);
      }),
      list: vi.fn(async (options?: any) => {
        const keys = Array.from(cacheStorage.keys());
        const filtered = options?.prefix
          ? keys.filter((k: any) => k.startsWith(options.prefix))
          : keys;
        return {
          keys: filtered.map((name: any) => ({ name })),
          list_complete: true,
          cursor: ''
        };
      })
    } as unknown as KVNamespace;
  });

  it('should handle complete cache workflow', async () => {
    const key = CacheKeys.templates();
    const data = { templates: [{ id: 1, name: 'Template 1' }] };

    await cacheSet(mockKV, key, data);

    const cached = await cacheGet<typeof data>(mockKV, key);
    expect(cached).toEqual(data);

    await cacheDelete(mockKV, key);

    const result = await cacheGet(mockKV, key);
    expect(result).toBeNull();
  });

  it('should implement cache-aside pattern correctly', async () => {
    const key = CacheKeys.posts();
    const freshData = { posts: [{ id: 1, title: 'Post 1' }] };
    let callCount = 0;

    const fetcher = vi.fn(async () => {
      callCount++;
      return freshData;
    });

    const result1 = await cacheGetOrSet(mockKV, key, fetcher);
    expect(result1).toEqual(freshData);
    expect(callCount).toBe(1);

    const result2 = await cacheGetOrSet(mockKV, key, fetcher);
    expect(result2).toEqual(freshData);
    expect(callCount).toBe(1);
  });

  it('should handle complex data structures', async () => {
    const key = 'complex-data';
    const complexData = {
      users: [
        { id: 1, name: 'User 1', role: 'admin' },
        { id: 2, name: 'User 2', role: 'client' }
      ],
      metadata: {
        total: 2,
        timestamp: Date.now()
      }
    };

    await cacheSet(mockKV, key, complexData);
    const result = await cacheGet<typeof complexData>(mockKV, key);

    expect(result).toEqual(complexData);
    expect(result?.users).toHaveLength(2);
    expect(result?.metadata.total).toBe(2);
  });

  it('should handle concurrent cache operations', async () => {
    const keys = [
      CacheKeys.user('user1'),
      CacheKeys.user('user2'),
      CacheKeys.user('user3')
    ];

    const operations = keys.map(key =>
      cacheSet(mockKV, key, { id: key })
    );

    await expect(Promise.all(operations)).resolves.not.toThrow();

    const results = await Promise.all(
      keys.map(key => cacheGet(mockKV, key))
    );

    results.forEach((result: any) => {
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });
  });
});

describe('Error Handling and Edge Cases', () => {
  it('should handle null values in cache', async () => {
    const mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as KVNamespace;

    const result = await cacheGet(mockKV, 'null-key');
    expect(result).toBeNull();
  });

  it('should handle undefined values in cache', async () => {
    const mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as KVNamespace;

    const result = await cacheGet(mockKV, 'undefined-key');
    expect(result).toBeNull();
  });

  it('should handle special characters in keys', async () => {
    const mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as KVNamespace;

    const key = 'key:with:special/characters?and#symbols';
    const value = { data: 'test' };

    await expect(cacheSet(mockKV, key, value)).resolves.not.toThrow();
  });

  it('should handle very large values', async () => {
    const mockKV = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as KVNamespace;

    const largeValue = 'x'.repeat(100000);
    const key = 'large-value-key';

    await expect(cacheSet(mockKV, key, largeValue)).resolves.not.toThrow();
  });

  it('should handle KV read errors gracefully', async () => {
    const mockKV = {
      get: vi.fn().mockRejectedValue(new Error('KV read error')),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as KVNamespace;

    await expect(cacheGet(mockKV, 'error-key')).rejects.toThrow('KV read error');
  });

  it('should handle KV write errors gracefully', async () => {
    const mockKV = {
      get: vi.fn(),
      put: vi.fn().mockRejectedValue(new Error('KV write error')),
      delete: vi.fn(),
      list: vi.fn()
    } as unknown as KVNamespace;

    await expect(cacheSet(mockKV, 'error-key', 'value')).rejects.toThrow('KV write error');
  });
});
