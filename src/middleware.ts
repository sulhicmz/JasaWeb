/**
 * Auth Middleware
 * Protects /dashboard/* routes, verifies JWT, injects user session
 * Adds CSRF protection for authenticated state-changing requests
 * Validates environment variables on startup
 */
import { defineMiddleware } from 'astro:middleware';
import { verifyToken, AUTH_COOKIE, CSRF_COOKIE, validateCsrfToken } from './lib/auth';
import { requiresAdminAccess } from './services/admin/auth';
import { validateEnvironment } from './lib/config';

// Environment validation flag to avoid repeated validation
let envValidated = false;

// Routes that require authentication
const protectedPaths = ['/dashboard'];

// Routes that should redirect if already logged in
const authPaths = ['/login', '/register'];

// Routes that require CSRF protection (authenticated state-changing)
const csrfProtectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
const csrfProtectedPaths = ['/api/'];

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, locals, request } = context;
    const pathname = url.pathname;
    const method = request.method;
    const env = locals.runtime?.env;

    // Environment validation (only once per application lifetime)
    if (!envValidated) {
        const validation = validateEnvironment(env);
        if (!validation.isValid) {
            const env = context.locals.runtime?.env;
            const isDev = env?.NODE_ENV === 'development' || import.meta.env.DEV;

            if (isDev) {
                // In development, show detailed errors but don't crash
                console.error('❌ Environment Variable Validation Failed:');
                console.error('Errors:', validation.errors);
                console.error('Warnings:', validation.warnings);
                console.error('');
                console.error('Please check your .env file and ensure all required variables are set.');
                console.error('Copy .env.example to .env and update the values.');
                console.error('');
            } else {
                // In production, this is a critical failure
                console.error('🚨 CRITICAL: Environment validation failed in production');
                return new Response(
                    JSON.stringify({
                        error: 'Configuration Error',
                        message: 'Server configuration is incomplete. Please contact administrator.',
                        debug_details: {
                            validation_errors: validation.errors,
                            env_keys_found: env ? Object.keys(env).filter(key => !key.includes('SECRET') && !key.includes('KEY')) : 'ENV_IS_UNDEFINED'
                        }
                    }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
        } else if (validation.warnings.length > 0) {
            const isDev = env?.NODE_ENV === 'development' || import.meta.env.DEV;
            if (isDev) {
                console.warn('⚠️ Environment Variable Warnings:');
                validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
                console.warn('');
            }
        }
        envValidated = true;
    }

    // Get token from cookie
    const token = cookies.get(AUTH_COOKIE)?.value;

    // Check if path is protected
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));
    const isAuthPath = authPaths.some(path => pathname === path);

    // Check if request needs CSRF protection
    const needsCsrfProtection = csrfProtectedMethods.includes(method) &&
        csrfProtectedPaths.some(path => pathname.startsWith(path));

    // CSRF validation for authenticated state-changing requests
    if (needsCsrfProtection && token) {
        const csrfTokenHeader = request.headers.get('x-csrf-token');
        const csrfTokenCookie = cookies.get(CSRF_COOKIE)?.value || null;

        if (!validateCsrfToken(csrfTokenHeader, csrfTokenCookie)) {
            return new Response('Invalid CSRF token', { status: 403 });
        }
    }

    if (token && env?.JWT_SECRET) {
        try {
            // Verify token and inject user into locals
            const user = await verifyToken(token, env.JWT_SECRET);
            locals.user = user || undefined;

            // Check for admin routes that require additional validation
            const requiresAdmin = requiresAdminAccess(pathname);
            if (requiresAdmin && user?.role !== 'admin') {
                return new Response('Admin access required', {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Redirect logged-in users away from auth pages
            if (isAuthPath) {
                return context.redirect('/dashboard');
            }
        } catch {
            // Invalid token - clear cookie
            cookies.delete(AUTH_COOKIE, { path: '/' });
            cookies.delete(CSRF_COOKIE, { path: '/' });
            locals.user = undefined;

            if (isProtected) {
                return context.redirect('/login');
            }
        }
    } else if (isProtected) {
        // No token, redirect to login
        return context.redirect('/login');
    }

    return next();
});
