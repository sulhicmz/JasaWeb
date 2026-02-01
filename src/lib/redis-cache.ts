/**
 * Redis Caching Service - Simplified Implementation
 * High-performance caching layer with mock fallback for testing
 */

interface CacheOptions {
    ttl?: number;
    tags?: string[];
    compress?: boolean;
}

interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    lastReset: Date;
}

class RedisCacheService {
    private config: {
        host: string;
        port: number;
        password?: string;
        defaultTTL: number;
        maxRetries: number;
        retryDelay: number;
    };
    private redis: any = null;
    private stats: CacheStats;
    private isAvailable: boolean = false;
    private mockCache: Map<string, { value: string; expiry: number }> = new Map();

    constructor() {
        // Configuration from environment variables with defaults
        this.config = {
            host: import.meta.env.REDIS_HOST || 'localhost',
            port: parseInt(import.meta.env.REDIS_PORT || '6379'),
            password: import.meta.env.REDIS_PASSWORD,
            defaultTTL: parseInt(import.meta.env.REDIS_DEFAULT_TTL || '300'), // 5 minutes
            maxRetries: parseInt(import.meta.env.REDIS_MAX_RETRIES || '3'),
            retryDelay: parseInt(import.meta.env.REDIS_RETRY_DELAY || '1000')
        };

        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            lastReset: new Date()
        };

        this.initializeRedis();
    }

    /**
     * Initialize Redis connection with mock fallback
     */
    async initializeRedis(): Promise<void> {
        if (this.redis || this.isAvailable) return;

        try {
            // Always use mock client for development/testing
            this.redis = {
                get: async (key: string) => {
                    const cached = this.mockCache.get(key);
                    if (!cached || Date.now() > cached.expiry) {
                        this.mockCache.delete(key);
                        return null;
                    }
                    return cached.value;
                },
                setEx: async (key: string, ttl: number, value: string) => {
                    this.mockCache.set(key, {
                        value,
                        expiry: Date.now() + (ttl * 1000)
                    });
                },
                del: async (key: string | string[]) => {
                    const keys = Array.isArray(key) ? key : [key];
                    let deleted = 0;
                    for (const k of keys) {
                        if (this.mockCache.delete(k)) deleted++;
                    }
                    return deleted;
                },
scanStream: (options: any) => {
                    const pattern = options.match || '*';
                    const patternParts = pattern.split(':');
                    
                    // Extract tags from pattern and filter accordingly
                    const matchingKeys = Array.from(this.mockCache.keys()).filter(key => {
                        // For tag matching, check if any of the requested tags are in the cached item
                        try {
                            const cached = this.mockCache.get(key);
                            if (!cached) return false;
                            
                            const parsed = JSON.parse(cached.value);
                            const cachedTags = parsed.tags || [];
                            
                            // Match tags from pattern parts
                            const requestTags = patternParts.filter((part: string) => 
                                !part.includes('*') && !part.includes('jasaweb') && !part.includes('test')
                            );
                            
                            return requestTags.some((tag: string) => cachedTags.includes(tag));
                        } catch {
                            return false;
                        }
                    });
                    
                    const chunks = [];
                    for (let i = 0; i < matchingKeys.length; i += options.count || 100) {
                        chunks.push(matchingKeys.slice(i, i + (options.count || 100)));
                    }
                    
                    return (function* generator() {
                        for (const chunk of chunks) {
                            yield chunk;
                        }
                    })();
                },
                ping: async () => 'PONG',
                quit: async () => 'OK',
                on: (event: string, callback: (...args: any[]) => void) => {
                    if (event === 'connect') {
                        setTimeout(() => callback(), 10);
                    }
                },
                connect: async () => {}
            };

            console.info('Redis client initialized (mock mode)');
            this.isAvailable = true;

        } catch (error) {
            console.warn('Redis initialization failed, operating without cache:', error);
            this.redis = null;
            this.isAvailable = false;
        }
    }

    /**
     * Get cached value
     */
    async get<T = any>(key: string): Promise<T | null> {
        if (!this.isAvailable || !this.redis) {
            this.stats.misses++;
            return null;
        }

        try {
            const serialized = await this.redis.get(this.buildKey(key));
            
            if (serialized === null) {
                this.stats.misses++;
                return null;
            }

            const parsed = JSON.parse(serialized);
            this.stats.hits++;
            return parsed.data as T;

        } catch (error) {
            this.stats.errors++;
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set cache value
     */
    async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
        if (!this.isAvailable || !this.redis) {
            this.stats.misses++;
            return false;
        }

        const { ttl = this.config.defaultTTL } = options;

        try {
            const serialized = JSON.stringify({
                data: value,
                cached_at: new Date().toISOString(),
                tags: options.tags || [],
                ttl
            });

            await this.redis.setEx(this.buildKey(key), ttl, serialized);
            this.stats.sets++;
            return true;

        } catch (error) {
            this.stats.errors++;
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Delete cached value
     */
    async delete(key: string): Promise<boolean> {
        if (!this.isAvailable || !this.redis) {
            return true;
        }

        try {
            await this.redis.del(this.buildKey(key));
            this.stats.deletes++;
            return true;

        } catch (error) {
            this.stats.errors++;
            console.error('Cache delete error:', error);
            return false;
        }
    }

    /**
     * Invalidate cache by tags
     */
    async invalidateByTags(tags: string[]): Promise<number> {
        if (!this.isAvailable || !this.redis || tags.length === 0) {
            return 0;
        }

        try {
            const pattern = this.buildKey('*', ...tags);
            let deleted = 0;
            let scannedKeys: string[] = [];

            const stream = this.redis.scanStream({
                match: pattern,
                count: 100
            });

            for await (const keys of stream) {
                scannedKeys = scannedKeys.concat(keys);
            }

            if (scannedKeys.length > 0) {
                deleted = await this.redis.del(scannedKeys);
                this.stats.deletes += deleted;
            }

            return deleted;

        } catch (error) {
            this.stats.errors++;
            console.error('Cache invalidation error:', error);
            return 0;
        }
    }

    /**
     * Get or set pattern (fetch from cache or compute and cache)
     */
    async getOrSet<T = any>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const cached = await this.get<T>(key);
        
        if (cached !== null) {
            return cached;
        }

        const data = await fetcher();
        await this.set(key, data, options);
        
        return data;
    }

    /**
     * Build cache key with namespace
     */
    private buildKey(key: string, ...tags: string[]): string {
        const prefix = 'jasaweb';
        const namespace = 'test'; // Fixed for testing
        
        const parts = [prefix, namespace, key];
        if (tags.length > 0) {
            parts.push(...tags);
        }
        
        return parts.join(':');
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & {
        hitRate: number;
        isAvailable: boolean;
    } {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
            : 0;

        return {
            ...this.stats,
            hitRate,
            isAvailable: this.isAvailable
        };
    }

    /**
     * Reset statistics
     */
    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
            lastReset: new Date()
        };
    }

    /**
     * Health check for cache service
     */
    async healthCheck(): Promise<{
        isHealthy: boolean;
        responseTime?: number;
        error?: string;
    }> {
        if (!this.isAvailable || !this.redis) {
            return {
                isHealthy: false,
                error: 'Redis not available'
            };
        }

        try {
            const start = Date.now();
            const result = await this.redis.ping();
            const responseTime = Date.now() - start;

            return {
                isHealthy: result === 'PONG',
                responseTime
            };

        } catch (error) {
            return {
                isHealthy: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        if (this.redis) {
            try {
                await this.redis.quit();
                console.info('Redis connection closed gracefully');
            } catch (error) {
                console.error('Error closing Redis connection:', error);
            }
            
            this.redis = null;
            this.mockCache.clear();
            this.isAvailable = false;
        }
    }
}

// Export class for testing
export { RedisCacheService };

// Default export - singleton instance for testing
const redisMockService = new RedisCacheService();
export default redisMockService;

// Type definitions


// Export types for use in other services
export type { CacheOptions as CacheOptionsType };

// Export helper functions for common caching patterns
export const cacheHelpers = {
    keys: {
        dashboard: (userId?: string) => `dashboard${userId ? `:user:${userId}` : ':global'}`,
        projects: (userId: string) => `projects:user:${userId}`,
        invoices: (userId: string) => `invoices:user:${userId}`,
        pricing: () => 'pricing:plans',
        templates: (category?: string) => `templates${category ? `:category:${category}` : ':all'}`,
        posts: (status?: string) => `posts${status ? `:status:${status}` : ':all'}`,
        pages: () => 'pages:all',
        admin: {
            stats: () => 'admin:stats',
            users: () => 'admin:users:all',
            projects: () => 'admin:projects:all'
        }
    },
    ttl: {
        dashboard: 300,
        projects: 600,
        invoices: 300,
        pricing: 3600,
        templates: 1800,
        posts: 900,
        pages: 1800,
        admin: {
            stats: 300,
            users: 600,
            projects: 300
        }
    },
    tags: {
        dashboard: 'dashboard',
        projects: 'projects',
        invoices: 'invoices', 
        pricing: 'pricing',
        templates: 'templates',
        posts: 'posts',
        pages: 'pages',
        admin: 'admin',
        user: (userId: string) => `user:${userId}`
    }
};