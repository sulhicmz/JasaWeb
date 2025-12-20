/**
 * Cloudflare KV Cache Service
 * Provides type-safe caching operations
 */

export interface CacheOptions {
    /** TTL in seconds */
    ttl?: number;
}

const DEFAULT_TTL = 3600; // 1 hour

/**
 * Get cached value by key
 */
export async function cacheGet<T>(
    kv: KVNamespace,
    key: string
): Promise<T | null> {
    const value = await kv.get(key, 'json');
    return value as T | null;
}

/**
 * Set cached value with optional TTL
 */
export async function cacheSet<T>(
    kv: KVNamespace,
    key: string,
    value: T,
    options?: CacheOptions
): Promise<void> {
    const ttl = options?.ttl ?? DEFAULT_TTL;
    await kv.put(key, JSON.stringify(value), {
        expirationTtl: ttl,
    });
}

/**
 * Delete cached value
 */
export async function cacheDelete(
    kv: KVNamespace,
    key: string
): Promise<void> {
    await kv.delete(key);
}

/**
 * Get or set cached value
 * If not cached, fetches and caches the result
 */
export async function cacheGetOrSet<T>(
    kv: KVNamespace,
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
): Promise<T> {
    const cached = await cacheGet<T>(kv, key);
    if (cached !== null) {
        return cached;
    }

    const value = await fetcher();
    await cacheSet(kv, key, value, options);
    return value;
}

/**
 * Invalidate cache by prefix
 */
export async function cacheInvalidateByPrefix(
    kv: KVNamespace,
    prefix: string
): Promise<void> {
    const list = await kv.list({ prefix });
    await Promise.all(list.keys.map((k) => kv.delete(k.name)));
}

// Cache key builders
export const CacheKeys = {
    templates: () => 'templates:all',
    templatesByCategory: (category: string) => `templates:${category}`,
    posts: () => 'posts:all',
    postBySlug: (slug: string) => `posts:${slug}`,
    pages: () => 'pages:all',
    pageBySlug: (slug: string) => `pages:${slug}`,
    user: (id: string) => `users:${id}`,
    projects: (userId: string) => `projects:${userId}`,
} as const;
