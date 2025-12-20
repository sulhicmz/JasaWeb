/**
 * Rate Limiting Tests
 * Tests fixed window implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, RateLimits } from './rate-limit';

describe('Rate Limiting', () => {
    let mockKV: {
        get: ReturnType<typeof vi.fn>;
        put: ReturnType<typeof vi.fn>;
    };
    let mockRequest: {
        headers: {
            get: ReturnType<typeof vi.fn>;
        };
    };

    beforeEach(() => {
        mockKV = {
            get: vi.fn(),
            put: vi.fn(),
        };
        mockRequest = {
            headers: {
                get: vi.fn(),
            },
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Fixed Window Behavior', () => {
        it('should allow first request', async () => {
            mockRequest.headers.get.mockReturnValue('192.168.1.1');
            mockKV.get.mockResolvedValue(null);

            const result = await checkRateLimit(
                mockRequest as any,
                mockKV as any,
                'auth',
                RateLimits.auth
            );

            expect(result).toBeNull();
            expect(mockKV.put).toHaveBeenCalledWith(
                expect.stringContaining('ratelimit:auth:192.168.1.1:'),
                '1',
                { expirationTtl: 60 }
            );
        });

        it('should allow requests within limit', async () => {
            mockRequest.headers.get.mockReturnValue('192.168.1.1');
            mockKV.get.mockResolvedValue('3');

            const result = await checkRateLimit(
                mockRequest as any,
                mockKV as any,
                'auth',
                RateLimits.auth
            );

            expect(result).toBeNull();
            expect(mockKV.put).toHaveBeenCalledWith(
                expect.stringContaining('ratelimit:auth:192.168.1.1:'),
                '4',
                { expirationTtl: 60 }
            );
        });

        it('should block requests exceeding limit', async () => {
            mockRequest.headers.get.mockReturnValue('192.168.1.1');
            mockKV.get.mockResolvedValue('5'); // At limit

            const result = await checkRateLimit(
                mockRequest as any,
                mockKV as any,
                'auth',
                RateLimits.auth
            );

            expect(result).not.toBeNull();
            expect(result?.status).toBe(429);
            expect(mockKV.put).not.toHaveBeenCalled();
        });

        it('should use different windows for different time periods', async () => {
            const now = Date.now();
            const windowSize = 60000; // 1 minute
            
            // Mock Date.now to return consistent timestamp
            vi.spyOn(Date, 'now').mockReturnValue(now);
            
            mockRequest.headers.get.mockReturnValue('192.168.1.1');
            mockKV.get.mockResolvedValue(null);

            await checkRateLimit(
                mockRequest as any,
                mockKV as any,
                'auth',
                RateLimits.auth
            );

            // Advance to next window
            vi.spyOn(Date, 'now').mockReturnValue(now + windowSize + 1000);
            mockKV.get.mockResolvedValue(null);

            await checkRateLimit(
                mockRequest as any,
                mockKV as any,
                'auth',
                RateLimits.auth
            );

            expect(mockKV.put).toHaveBeenCalledTimes(2);
            
            // Verify different window keys
            const firstCall = mockKV.put.mock.calls[0][0];
            const secondCall = mockKV.put.mock.calls[1][0];
            expect(firstCall).not.toBe(secondCall);
            
            vi.restoreAllMocks();
        });

        it('should handle unknown IP gracefully', async () => {
            mockRequest.headers.get.mockReturnValue(null);
            mockKV.get.mockResolvedValue(null);

            const result = await checkRateLimit(
                mockRequest as any,
                mockKV as any,
                'auth',
                RateLimits.auth
            );

            expect(result).toBeNull();
            expect(mockKV.put).toHaveBeenCalledWith(
                expect.stringContaining('ratelimit:auth:unknown:'),
                '1',
                { expirationTtl: 60 }
            );
        });

        it('should respect different rate limit configs', async () => {
            mockRequest.headers.get.mockReturnValue('192.168.1.1');
            mockKV.get.mockResolvedValue('59'); // Just under API limit

            const result = await checkRateLimit(
                mockRequest as any,
                mockKV as any,
                'api',
                RateLimits.api
            );

            expect(result).toBeNull();
            expect(mockKV.put).toHaveBeenCalledWith(
                expect.stringContaining('ratelimit:api:192.168.1.1:'),
                '60',
                { expirationTtl: 60 }
            );
        });
    });

    describe('Window Key Generation', () => {
        it('should generate consistent window keys within same minute', async () => {
            const now = 1609459200000; // Fixed timestamp
            vi.spyOn(Date, 'now').mockReturnValue(now);

            mockRequest.headers.get.mockReturnValue('192.168.1.1');
            mockKV.get.mockResolvedValue(null);

            const config = { limit: 5, window: 60 };

            await checkRateLimit(mockRequest as any, mockKV as any, 'test', config);
            const firstKey = mockKV.put.mock.calls[0][0];

            vi.clearAllMocks();
            await checkRateLimit(mockRequest as any, mockKV as any, 'test', config);
            const secondKey = mockKV.put.mock.calls[0][0];

            expect(firstKey).toBe(secondKey);
            vi.restoreAllMocks();
        });
    });
});