/**
 * Rate Limiting Service
 * Uses Cloudflare KV for distributed rate limiting
 */

import { errorResponse } from './api';

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
 * Check if request exceeded rate limit
 * Returns null if allowed, Response if blocked
 */
export async function checkRateLimit(
    request: Request,
    kv: KVNamespace,
    action: string,
    config: RateLimitConfig
): Promise<Response | null> {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `ratelimit:${action}:${ip}`;

    // Get current count
    const count = await kv.get(key, 'text');
    const current = count ? parseInt(count) : 0;

    if (current >= config.limit) {
        return errorResponse('Too many requests, please try again later.', 429);
    }

    // Increment count
    // If key doesn't exist, this will create it with expiration
    // If key exists, we overwrite (increment) but need to preserve TTL?
    // KV simple approach: just set expiration on every write or let it expire
    // Better approach for fixed window:
    // If not exists, set = 1 with TTL.
    // If exists, increment (get + put).

    // Optimistic usage:
    const newCount = current + 1;

    // For the first request, set the expiration
    if (newCount === 1) {
        await kv.put(key, newCount.toString(), { expirationTtl: config.window });
    } else {
        // For subsequent requests, update value but keep TTL (KV doesn't support 'keep ttl' natively efficiently in one go without reading metadata)
        // Simplified: Just reset TTL to window on every hit (Sliding window-ish) OR
        // Strict Fixed Window: Check metadata.
        // For this iteration, simplified "reset TTL" or "fixed TTL from first write" is fine.
        // Implementing simple fixed window where TTL resets on first write only is harder without knowing remaining TTL.
        // Let's use simple sliding-expiration: every hit extends the block? No, that's bad.
        // Let's use: Set expiration only if creating new.

        // However, standard KV `put` overwrites.
        // Valid strategy for simple rate limit: 
        // Just write with expirationTtl = window. 
        // This effectively makes it "limit requests in the LAST window seconds" roughly.
        // Actually, no. If I write with TTL 60s, it expires 60s from NOW.
        // So 5 fast requests -> blocked.
        // 6th request at 61s -> allowed?
        // Yes.
        await kv.put(key, newCount.toString(), { expirationTtl: config.window });
    }

    return null;
}
