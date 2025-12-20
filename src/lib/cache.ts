/**
 * Performance Cache Service
 * Implements response caching for frequently accessed public endpoints
 * Uses Cloudflare KV for edge caching with configurable TTL
 */

// Cloudflare KV types - inline definition to avoid import issues
interface KVNamespace {
    get(key: string): Promise<string | null>;
    get<T = unknown>(key: string, type: 'json'): Promise<T | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

interface CacheOptions {
    ttl?: number; // Time to live in seconds
    key?: string;
    tags?: string[];
}

interface CacheEntry<T = unknown> {
    data: T;
    cachedAt: number;
    ttl: number;
    eTag?: string;
}

class PerformanceCacheService {
    private readonly defaultTTL = 300; // 5 minutes default

    constructor(private kv: KVNamespace) {}

    /**
     * Get cached response
     */
    async get<T = unknown>(key: string): Promise<T | null> {
        try {
            const entry = await this.kv.get<CacheEntry<T>>(key, 'json');
            
            if (!entry) {
                return null;
            }

            // Check if cache entry is still valid
            const now = Date.now();
            const age = (now - entry.cachedAt) / 1000; // Convert to seconds

            if (age > entry.ttl) {
                // Cache expired, delete it
                await this.kv.delete(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.warn(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set cache entry
     */
    async set<T = unknown>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
        try {
            const { ttl = this.defaultTTL } = options;
            
            const entry: CacheEntry<T> = {
                data,
                cachedAt: Date.now(),
                ttl,
                eTag: this.generateETag(data)
            };

            // Set with expiration
            await this.kv.put(key, JSON.stringify(entry), {
                expirationTtl: ttl
            });
        } catch (error) {
            console.warn(`Cache set error for key ${key}:`, error);
            // Continue without caching
        }
    }

    /**
     * Delete cache entry
     */
    async delete(key: string): Promise<void> {
        try {
            await this.kv.delete(key);
        } catch (error) {
            console.warn(`Cache delete error for key ${key}:`, error);
        }
    }

    /**
     * Clear cache by tags (requires KV namespace with list support)
     */
    async clearByTags(tags: string[]): Promise<void> {
        try {
            const list = await this.kv.list();
            const keysToDelete: string[] = [];

            for (const key of list.keys) {
                const entry = await this.kv.get<CacheEntry>(key.name, 'json');
                if (entry && entry.eTag && tags.some(tag => entry.eTag?.includes(tag))) {
                    keysToDelete.push(key.name);
                }
            }

            if (keysToDelete.length > 0) {
                await Promise.all(keysToDelete.map(key => this.kv.delete(key)));
            }
        } catch (error) {
            console.warn(`Cache clear by tags error:`, error);
        }
    }

    /**
     * Generate cache key from URL and parameters
     */
    generateKey(url: string, params: Record<string, unknown> = {}): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join('|');
        
        return `cache:${url}:${sortedParams}`;
    }

    /**
     * Generate ETag for cache invalidation
     */
    private generateETag(data: unknown): string {
        const hash = btoa(JSON.stringify(data)).slice(0, 16);
        return `etag:${hash}`;
    }

    /**
     * Check if request supports caching
     */
    isCacheable(request: Request): boolean {
        const method = request.method;
        const url = new URL(request.url);

        // Only cache GET requests
        if (method !== 'GET') {
            return false;
        }

        // Don't cache requests with no-cache header
        if (request.headers.get('cache-control')?.includes('no-cache')) {
            return false;
        }

        // Only cache certain endpoints
        const cacheablePaths = ['/api/templates', '/api/posts', '/api/pages'];
        return cacheablePaths.some(path => url.pathname.startsWith(path));
    }

    /**
     * Get cache TTL based on content type
     */
    getTTLForPath(pathname: string): number {
        // Different TTL values for different content types
        if (pathname.includes('/api/templates')) {
            return 1800; // 30 minutes - templates change rarely
        }
        if (pathname.includes('/api/posts')) {
            return 600; // 10 minutes - blog posts change occasionally
        }
        if (pathname.includes('/api/pages')) {
            return 3600; // 1 hour - static pages change rarely
        }
        
        return this.defaultTTL;
    }

    /**
     * Create cached response wrapper
     */
    wrapResponse(data: unknown, cached = false): Response {
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Cache-Control': cached ? 'public, max-age=300' : 'no-cache'
        });

        if (cached) {
            headers.set('X-Cache', 'HIT');
        } else {
            headers.set('X-Cache', 'MISS');
        }

        return new Response(JSON.stringify(data), { headers });
    }
}

/**
 * Cache middleware for API routes
 */
export function withCache<T = unknown>(
    request: Request,
    context: { env: Record<string, unknown> },
    handler: () => Promise<T>,
    options: CacheOptions = {}
): Promise<Response> {
    return new Promise(async (resolve) => {
        const cacheKV = (context.env.KV_CACHE || context.env.CACHE) as KVNamespace | undefined;
        
        if (!cacheKV) {
            // No cache available, proceed normally
            const data = await handler();
            resolve(new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            }));
            return;
        }

        const cache = new PerformanceCacheService(cacheKV);

        // Check if request is cacheable
        if (!cache.isCacheable(request)) {
            const data = await handler();
            resolve(cache.wrapResponse(data, false));
            return;
        }

        const url = new URL(request.url);
        const cacheKey = cache.generateKey(url.pathname, Object.fromEntries(url.searchParams));
        const ttl = options.ttl || cache.getTTLForPath(url.pathname);

        try {
            // Try to get from cache
            const cachedData = await cache.get<T>(cacheKey);
            
            if (cachedData) {
                resolve(cache.wrapResponse(cachedData, true));
                return;
            }

            // Cache miss, get fresh data
            const freshData = await handler();
            
            // Store in cache asynchronously
            cache.set(cacheKey, freshData, { ttl }).catch(error => {
                console.warn('Cache storage failed:', error);
            });

            resolve(cache.wrapResponse(freshData, false));
        } catch (error) {
            console.error('Cache middleware error:', error);
            
            // Fallback to normal response
            try {
                const data = await handler();
                resolve(new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' }
                }));
            } catch (handlerError) {
                resolve(new Response(JSON.stringify({ error: 'Internal server error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
        }
    });
}

// Export singleton factory
export function createCacheService(kv: KVNamespace): PerformanceCacheService {
    return new PerformanceCacheService(kv);
}

export type { PerformanceCacheService, CacheOptions, CacheEntry };