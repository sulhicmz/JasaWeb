/**
 * Auth Middleware
 * Protects /dashboard/* routes, verifies JWT, injects user session
 */
import { defineMiddleware } from 'astro:middleware';
import { verifyToken, AUTH_COOKIE } from './lib/auth';

// Routes that require authentication
const protectedPaths = ['/dashboard'];

// Routes that should redirect if already logged in
const authPaths = ['/login', '/register'];

export const onRequest = defineMiddleware(async (context, next) => {
    const { url, cookies, locals } = context;
    const pathname = url.pathname;
    const env = locals.runtime?.env;

    // Get token from cookie
    const token = cookies.get(AUTH_COOKIE)?.value;

    // Check if path is protected
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));
    const isAuthPath = authPaths.some(path => pathname === path);

    if (token && env?.JWT_SECRET) {
        try {
            // Verify token and inject user into locals
            const user = await verifyToken(token, env.JWT_SECRET);
            locals.user = user;

            // Redirect logged-in users away from auth pages
            if (isAuthPath) {
                return context.redirect('/dashboard');
            }
        } catch {
            // Invalid token - clear cookie
            cookies.delete(AUTH_COOKIE, { path: '/' });
            locals.user = null;

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
