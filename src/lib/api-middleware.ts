/**
 * API Middleware System
 * Provides composable middleware for common API patterns:
 * - Rate limiting
 * - Admin authentication
 * - CSRF protection
 * - Combined middleware wrappers
 */

import type { APIContext, APIRoute } from 'astro';
import { checkRateLimit, RateLimits, type RateLimitConfig } from '@/lib/rate-limit';
import { validateAdminAccess } from '@/services/admin/auth';
import { validateCsrfToken, CSRF_COOKIE } from '@/lib/auth';
import { errorResponse } from '@/lib/api';

export interface MiddlewareConfig {
    rateLimit?: {
        key: string;
        config: RateLimitConfig;
    };
    requireAdmin?: boolean;
    requireCsrf?: boolean;
}

export type MiddlewareNext = () => Promise<Response>;

export type MiddlewareHandler = (
    context: APIContext,
    next: MiddlewareNext
) => Promise<Response>;

export interface APIRouteHandler {
    (context: APIContext): Promise<Response>;
}

// ==============================================
// INDIVIDUAL MIDDLEWARE
// ==============================================

/**
 * Rate limiting middleware
 * Checks request rate limit and returns 429 if exceeded
 */
export async function rateLimitMiddleware(
    context: APIContext,
    next: MiddlewareNext,
    key: string,
    config: RateLimitConfig
): Promise<Response> {
    if (!context.locals.runtime?.env?.CACHE) {
        return next();
    }

    const limitResult = await checkRateLimit(
        context.request,
        context.locals.runtime.env.CACHE,
        key,
        config
    );
    if (limitResult) return limitResult;

    return next();
}

/**
 * Admin authentication middleware
 * Validates user has admin role
 */
export async function adminAuthMiddleware(
    context: APIContext,
    next: MiddlewareNext
): Promise<Response> {
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
        return authValidation.response!;
    }

    return next();
}

/**
 * CSRF protection middleware
 * Validates CSRF token from header matches cookie
 */
export async function csrfProtectionMiddleware(
    context: APIContext,
    next: MiddlewareNext
): Promise<Response> {
    const csrfToken = context.request.headers.get('x-csrf-token');
    const csrfCookie = context.cookies.get(CSRF_COOKIE)?.value || null;

    if (!validateCsrfToken(csrfToken, csrfCookie)) {
        return errorResponse('Invalid CSRF token', 403);
    }

    return next();
}

// ==============================================
// MIDDLEWARE COMPOSERS
// ==============================================

/**
 * Compose multiple middleware into a single handler
 * Middleware executes in order (first to last)
 */
export function composeMiddleware(...middleware: MiddlewareHandler[]): MiddlewareHandler {
    return async (context: APIContext, next: MiddlewareNext): Promise<Response> => {
        let index = 0;

        const dispatch = async (): Promise<Response> => {
            if (index >= middleware.length) {
                return next();
            }

            const handler = middleware[index++];
            return handler(context, dispatch);
        };

        return dispatch();
    };
}

/**
 * Create middleware from configuration
 */
export function createMiddleware(config: MiddlewareConfig): MiddlewareHandler {
    const middlewareList: MiddlewareHandler[] = [];

    if (config.rateLimit) {
        middlewareList.push(
            async (context: APIContext, next: MiddlewareNext): Promise<Response> => {
                return rateLimitMiddleware(context, next, config.rateLimit!.key, config.rateLimit!.config);
            }
        );
    }

    if (config.requireAdmin) {
        middlewareList.push(adminAuthMiddleware);
    }

    if (config.requireCsrf) {
        middlewareList.push(csrfProtectionMiddleware);
    }

    return composeMiddleware(...middlewareList);
}

// ==============================================
// HIGHER-ORDER FUNCTION WRAPPERS
// ==============================================

/**
 * Wrap API route handler with rate limiting
 */
export function withRateLimit(key: string, config: RateLimitConfig) {
    return function(handler: APIRouteHandler): APIRoute {
        return async (context: APIContext): Promise<Response> => {
            return rateLimitMiddleware(context, () => handler(context), key, config);
        };
    };
}

/**
 * Wrap API route handler with admin authentication
 */
export function withAdminAuth(handler: APIRouteHandler): APIRoute {
    return async (context: APIContext): Promise<Response> => {
        return adminAuthMiddleware(context, () => handler(context));
    };
}

/**
 * Wrap API route handler with CSRF protection
 */
export function withCsrfProtection(handler: APIRouteHandler): APIRoute {
    return async (context: APIContext): Promise<Response> => {
        return csrfProtectionMiddleware(context, () => handler(context));
    };
}

/**
 * Wrap API route handler with combined API protection
 * Rate limit + admin auth + CSRF protection
 */
export function withApiProtection(
    rateLimitKey?: string,
    config?: RateLimitConfig,
    options: { requireAdmin?: boolean; requireCsrf?: boolean } = {}
) {
    return function(handler: APIRouteHandler): APIRoute {
        const middleware = createMiddleware({
            rateLimit: rateLimitKey
                ? { key: rateLimitKey, config: config || RateLimits.api }
                : undefined,
            requireAdmin: options.requireAdmin !== false,
            requireCsrf: options.requireCsrf !== false,
        });

        return async (context: APIContext): Promise<Response> => {
            return middleware(context, () => handler(context));
        };
    };
}

/**
 * Wrap API route handler with public API protection
 * Rate limit only (no auth/CSRF)
 */
export function withPublicApiProtection(rateLimitKey: string, config?: RateLimitConfig) {
    return withApiProtection(rateLimitKey, config, {
        requireAdmin: false,
        requireCsrf: false,
    });
}

// ==============================================
// PRE-CONFIGURED MIDDLEWARE
// ==============================================

/**
 * Pre-configured admin API middleware
 * Rate limiting + admin auth + CSRF protection
 */
export const adminApiMiddleware = (key: string): MiddlewareHandler => {
    return createMiddleware({
        rateLimit: { key, config: RateLimits.api },
        requireAdmin: true,
        requireCsrf: true,
    });
};

/**
 * Pre-configured public API middleware
 * Rate limiting only
 */
export const publicApiMiddleware = (key: string): MiddlewareHandler => {
    return createMiddleware({
        rateLimit: { key, config: RateLimits.api },
        requireAdmin: false,
        requireCsrf: false,
    });
};

/**
 * Pre-configured auth API middleware
 * Stricter rate limiting (auth limits)
 */
export const authApiMiddleware = (key: string): MiddlewareHandler => {
    return createMiddleware({
        rateLimit: { key, config: RateLimits.auth },
        requireAdmin: false,
        requireCsrf: false,
    });
};
