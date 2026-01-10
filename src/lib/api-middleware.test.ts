/**
 * API Middleware Tests
 * Tests for rate limiting, admin auth, CSRF protection, and composed middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    rateLimitMiddleware,
    adminAuthMiddleware,
    csrfProtectionMiddleware,
    composeMiddleware,
    createMiddleware,
    withRateLimit,
    withAdminAuth,
    withCsrfProtection,
    withApiProtection,
    withPublicApiProtection,
    adminApiMiddleware,
    publicApiMiddleware,
    authApiMiddleware,
} from '@/lib/api-middleware';
import { errorResponse } from '@/lib/api';
import { RateLimits } from '@/lib/rate-limit';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: vi.fn(),
    RateLimits: {
        auth: { limit: 5, window: 60 },
        api: { limit: 60, window: 60 },
    },
}));

vi.mock('@/services/admin/auth', () => ({
    validateAdminAccess: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    CSRF_COOKIE: 'jasaweb_csrf',
    validateCsrfToken: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
    errorResponse: vi.fn(),
}));

import { checkRateLimit } from '@/lib/rate-limit';
import { validateAdminAccess } from '@/services/admin/auth';
import { validateCsrfToken } from '@/lib/auth';

describe('API Middleware', () => {
    let mockContext: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockContext = {
            request: {
                headers: {
                    get: vi.fn(),
                },
            },
            locals: {
                runtime: {
                    env: {
                        CACHE: 'mock-kv-namespace',
                    },
                },
            },
            cookies: {
                get: vi.fn(),
            },
        };
    });

    describe('rateLimitMiddleware', () => {
        it('should pass when rate limit check returns null', async () => {
            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            vi.mocked(checkRateLimit).mockResolvedValue(null);

            const result = await rateLimitMiddleware(
                mockContext,
                mockNext,
                'test-action',
                RateLimits.api
            );

            expect(checkRateLimit).toHaveBeenCalledWith(
                mockContext.request,
                mockContext.locals.runtime.env.CACHE,
                'test-action',
                RateLimits.api
            );
            expect(mockNext).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Response);
        });

        it('should return error response when rate limit exceeded', async () => {
            const mockNext = vi.fn();
            const mockErrorResponse = new Response('Too many requests', {
                status: 429,
            });

            vi.mocked(checkRateLimit).mockResolvedValue(mockErrorResponse);
            vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

            const result = await rateLimitMiddleware(
                mockContext,
                mockNext,
                'test-action',
                RateLimits.api
            );

            expect(result).toBe(mockErrorResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should skip rate limiting when CACHE not available', async () => {
            mockContext.locals.runtime.env.CACHE = undefined;
            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            await rateLimitMiddleware(
                mockContext,
                mockNext,
                'test-action',
                RateLimits.api
            );

            expect(checkRateLimit).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('adminAuthMiddleware', () => {
        it('should pass when user is admin', async () => {
            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            vi.mocked(validateAdminAccess).mockReturnValue({
                isAuthorized: true,
                user: { id: 'admin-1', role: 'admin', email: 'admin@test.com', name: 'Admin' },
            });

            const result = await adminAuthMiddleware(mockContext, mockNext);

            expect(validateAdminAccess).toHaveBeenCalledWith(mockContext);
            expect(mockNext).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Response);
        });

        it('should return error when user is not admin', async () => {
            const mockNext = vi.fn();
            const mockErrorResponse = new Response('Forbidden', {
                status: 403,
            });

            vi.mocked(validateAdminAccess).mockReturnValue({
                isAuthorized: false,
                response: mockErrorResponse,
            });

            const result = await adminAuthMiddleware(mockContext, mockNext);

            expect(result).toBe(mockErrorResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('csrfProtectionMiddleware', () => {
        it('should pass when CSRF tokens match', async () => {
            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            mockContext.request.headers.get.mockReturnValue('valid-csrf-token');
            mockContext.cookies.get.mockReturnValue({
                value: 'valid-csrf-token',
            });

            vi.mocked(validateCsrfToken).mockReturnValue(true);

            await csrfProtectionMiddleware(
                mockContext,
                mockNext
            );

            expect(validateCsrfToken).toHaveBeenCalledWith(
                'valid-csrf-token',
                'valid-csrf-token'
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it('should return error when CSRF tokens do not match', async () => {
            const mockNext = vi.fn();
            const mockErrorResponse = new Response('Invalid CSRF token', {
                status: 403,
            });

            mockContext.request.headers.get.mockReturnValue('invalid-token');
            mockContext.cookies.get.mockReturnValue({ value: 'valid-csrf-token' });

            vi.mocked(validateCsrfToken).mockReturnValue(false);
            vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

            const result = await csrfProtectionMiddleware(
                mockContext,
                mockNext
            );

            expect(result).toBe(mockErrorResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return error when CSRF token is missing from header', async () => {
            const mockNext = vi.fn();
            const mockErrorResponse = new Response('Invalid CSRF token', {
                status: 403,
            });

            mockContext.request.headers.get.mockReturnValue(null);
            mockContext.cookies.get.mockReturnValue({ value: 'valid-csrf-token' });

            vi.mocked(validateCsrfToken).mockReturnValue(false);
            vi.mocked(errorResponse).mockReturnValue(mockErrorResponse);

            const result = await csrfProtectionMiddleware(
                mockContext,
                mockNext
            );

            expect(result).toBe(mockErrorResponse);
        });
    });

    describe('composeMiddleware', () => {
        it('should execute middleware in order', async () => {
            const executionOrder: string[] = [];

            const middleware1: any = async (
                _ctx: any,
                next: any
            ): Promise<Response> => {
                executionOrder.push('1');
                return next();
            };

            const middleware2: any = async (
                _ctx: any,
                next: any
            ): Promise<Response> => {
                executionOrder.push('2');
                return next();
            };

            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            const composed = composeMiddleware(middleware1, middleware2);
            await composed(mockContext, mockNext);

            expect(executionOrder).toEqual(['1', '2']);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should stop execution if middleware returns response', async () => {
            const middleware1: any = async (
                _ctx: any
            ): Promise<Response> => {
                return new Response('Stopped', { status: 403 });
            };

            const middleware2: any = vi.fn();
            const mockNext = vi.fn();

            const composed = composeMiddleware(middleware1, middleware2);
            const result = await composed(mockContext, mockNext);

            expect(result.status).toBe(403);
            expect(middleware2).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('createMiddleware', () => {
        it('should create middleware with rate limit config', async () => {
            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            vi.mocked(checkRateLimit).mockResolvedValue(null);

            const middleware = createMiddleware({
                rateLimit: { key: 'test', config: RateLimits.api },
            });

            await middleware(mockContext, mockNext);

            expect(checkRateLimit).toHaveBeenCalled();
        });

        it('should create middleware with admin auth', async () => {
            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            vi.mocked(validateAdminAccess).mockReturnValue({
                isAuthorized: true,
                user: { id: 'admin-1', role: 'admin', email: 'admin@test.com', name: 'Admin' },
            });

            const middleware = createMiddleware({
                requireAdmin: true,
            });

            await middleware(mockContext, mockNext);

            expect(validateAdminAccess).toHaveBeenCalled();
        });

        it('should create middleware with CSRF protection', async () => {
            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            mockContext.request.headers.get.mockReturnValue('valid-csrf-token');
            mockContext.cookies.get.mockReturnValue({
                value: 'valid-csrf-token',
            });

            vi.mocked(validateCsrfToken).mockReturnValue(true);

            const middleware = createMiddleware({
                requireCsrf: true,
            });

            await middleware(mockContext, mockNext);

            expect(validateCsrfToken).toHaveBeenCalled();
        });

        it('should create combined middleware', async () => {
            const mockNext = vi.fn().mockResolvedValue(
                new Response('OK', { status: 200 })
            );

            vi.mocked(checkRateLimit).mockResolvedValue(null);
            vi.mocked(validateAdminAccess).mockReturnValue({
                isAuthorized: true,
                user: { id: 'admin-1', role: 'admin', email: 'admin@test.com', name: 'Admin' },
            });
            mockContext.request.headers.get.mockReturnValue('valid-csrf-token');
            mockContext.cookies.get.mockReturnValue({
                value: 'valid-csrf-token',
            });
            vi.mocked(validateCsrfToken).mockReturnValue(true);

            const middleware = createMiddleware({
                rateLimit: { key: 'test', config: RateLimits.api },
                requireAdmin: true,
                requireCsrf: true,
            });

            await middleware(mockContext, mockNext);

            expect(checkRateLimit).toHaveBeenCalled();
            expect(validateAdminAccess).toHaveBeenCalled();
            expect(validateCsrfToken).toHaveBeenCalled();
        });
    });

    describe('Higher-order function wrappers', () => {
        describe('withRateLimit', () => {
            it('should wrap handler with rate limiting', async () => {
                const mockHandler = vi.fn().mockResolvedValue(
                    new Response('OK', { status: 200 })
                );

                vi.mocked(checkRateLimit).mockResolvedValue(null);

            const wrapped = withRateLimit('test', RateLimits.api)(mockHandler);
            await wrapped(mockContext);

            expect(checkRateLimit).toHaveBeenCalled();
            });
        });

        describe('withAdminAuth', () => {
            it('should wrap handler with admin auth', async () => {
                const mockHandler = vi.fn().mockResolvedValue(
                    new Response('OK', { status: 200 })
                );

                vi.mocked(validateAdminAccess).mockReturnValue({
                    isAuthorized: true,
                    user: { id: 'admin-1', role: 'admin', email: 'admin@test.com', name: 'Admin' },
                });

                const wrapped = withAdminAuth(mockHandler);
                await wrapped(mockContext);

                expect(validateAdminAccess).toHaveBeenCalled();
            });
        });

        describe('withCsrfProtection', () => {
            it('should wrap handler with CSRF protection', async () => {
                const mockHandler = vi.fn().mockResolvedValue(
                    new Response('OK', { status: 200 })
                );

                mockContext.request.headers.get.mockReturnValue('valid-csrf-token');
                mockContext.cookies.get.mockReturnValue({
                    value: 'valid-csrf-token',
                });
                vi.mocked(validateCsrfToken).mockReturnValue(true);

                const wrapped = withCsrfProtection(mockHandler);
                await wrapped(mockContext);

                expect(validateCsrfToken).toHaveBeenCalled();
            });
        });

        describe('withApiProtection', () => {
            it('should wrap handler with full API protection', async () => {
                const mockHandler = vi.fn().mockResolvedValue(
                    new Response('OK', { status: 200 })
                );

                vi.mocked(checkRateLimit).mockResolvedValue(null);
                vi.mocked(validateAdminAccess).mockReturnValue({
                    isAuthorized: true,
                    user: { id: 'admin-1', role: 'admin', email: 'admin@test.com', name: 'Admin' },
                });
                mockContext.request.headers.get.mockReturnValue('valid-csrf-token');
                mockContext.cookies.get.mockReturnValue({
                    value: 'valid-csrf-token',
                });
                vi.mocked(validateCsrfToken).mockReturnValue(true);

                const wrapped = withApiProtection('test', RateLimits.api)(mockHandler);
                const result = await wrapped(mockContext);

                expect(result).toBeInstanceOf(Response);
                expect(checkRateLimit).toHaveBeenCalled();
                expect(validateAdminAccess).toHaveBeenCalled();
                expect(validateCsrfToken).toHaveBeenCalled();
            });

            it('should support public API protection', async () => {
                const mockHandler = vi.fn().mockResolvedValue(
                    new Response('OK', { status: 200 })
                );

                vi.mocked(checkRateLimit).mockResolvedValue(null);

                const wrapped = withPublicApiProtection('test')(mockHandler);
                const result = await wrapped(mockContext);

                expect(result).toBeInstanceOf(Response);
                expect(checkRateLimit).toHaveBeenCalled();
            });
        });
    });

    describe('Pre-configured middleware', () => {
            it('adminApiMiddleware should provide full protection', async () => {
                const mockNext = vi.fn().mockResolvedValue(
                    new Response('OK', { status: 200 })
                );

                vi.mocked(checkRateLimit).mockResolvedValue(null);
                vi.mocked(validateAdminAccess).mockReturnValue({
                    isAuthorized: true,
                    user: { id: 'admin-1', role: 'admin', email: 'admin@test.com', name: 'Admin' },
                });
                mockContext.request.headers.get.mockReturnValue('valid-csrf-token');
                mockContext.cookies.get.mockReturnValue({
                    value: 'valid-csrf-token',
                });
                vi.mocked(validateCsrfToken).mockReturnValue(true);

                const middleware = adminApiMiddleware('test');
                await middleware(mockContext, mockNext);

                expect(checkRateLimit).toHaveBeenCalled();
                expect(validateAdminAccess).toHaveBeenCalled();
                expect(validateCsrfToken).toHaveBeenCalled();
            });

            it('publicApiMiddleware should provide rate limiting only', async () => {
                const _mockNext = vi.fn().mockResolvedValue(
                    new Response('OK', { status: 200 })
                );

                vi.mocked(checkRateLimit).mockResolvedValue(null);

                const middleware = publicApiMiddleware('test');
                await middleware(mockContext, _mockNext);

                expect(checkRateLimit).toHaveBeenCalled();
                expect(validateAdminAccess).not.toHaveBeenCalled();
                expect(validateCsrfToken).not.toHaveBeenCalled();
            });

            it('authApiMiddleware should provide stricter rate limiting', async () => {
                const _mockNext = vi.fn().mockResolvedValue(
                    new Response('OK', { status: 200 })
                );

                vi.mocked(checkRateLimit).mockResolvedValue(null);

                const middleware = authApiMiddleware('test');
                await middleware(mockContext, _mockNext);

                expect(checkRateLimit).toHaveBeenCalledWith(
                    mockContext.request,
                    mockContext.locals.runtime.env.CACHE,
                    'test',
                    RateLimits.auth
                );
            });
        });
});