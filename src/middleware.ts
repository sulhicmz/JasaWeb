/**
 * Auth Middleware
 * Protects /dashboard/* routes, verifies JWT, injects user session
 * Adds CSRF protection for authenticated state-changing requests
 */
import { defineMiddleware } from 'astro:middleware';
import { verifyToken, AUTH_COOKIE, CSRF_COOKIE, validateCsrfToken } from './lib/auth';

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
