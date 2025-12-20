/**
 * Rate Limiting Service
 * Uses Cloudflare KV for distributed rate limiting
 */

import { errorResponse } from './api';

type KVNamespace = any;

export interface RateLimitConfig {
    /** Max requests allowed within window */
    limit: number;
    /** Time window in seconds */
    window: number;
}

export const RateLimits = {
    auth: { limit: 5, window: 60 }, // 5 attempts per minute
    api: { limit: 60, window: 60 }, // 60 requests per minute
} as const;

/**
 * Check if request exceeded rate limit using FIXED WINDOW approach
 * Returns null if allowed, Response if blocked
 */
export async function checkRateLimit(
    request: Request,
    kv: KVNamespace,
    action: string,
    config: RateLimitConfig
): Promise<Response | null> {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // Fixed window: use timestamp-based keys
    const windowStart = Math.floor(Date.now() / (config.window * 1000)) * (config.window * 1000);
    const key = `ratelimit:${action}:${ip}:${windowStart}`;

    // Get current count for this window
    const count = await kv.get(key, 'text');
    const current = count ? parseInt(count) : 0;

    if (current >= config.limit) {
        return errorResponse('Too many requests, please try again later.', 429);
    }

    // Increment count with expiration matching window duration
    const newCount = current + 1;
    await kv.put(key, newCount.toString(), { expirationTtl: config.window });

    return null;
}
