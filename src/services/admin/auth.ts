/**
 * Admin Authentication Utilities
 * Provides role-based access control for admin operations
 */

import type { APIContext } from 'astro';
import { errorResponse } from '@/lib/api';
import type { UserRole } from '@/lib/types';

// Simplified user interface for session context (partial User)
interface SessionUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

// ==============================================
// ADMIN AUTH UTILITIES
// ==============================================

/**
 * Check if current user has admin role
 */
export function isAdmin(user: SessionUser | undefined): boolean {
    return user?.role === 'admin';
}

/**
 * Validate admin access and return error if unauthorized
 */
export function requireAdmin(context: APIContext): Response | null {
    const user = context.locals.user;

    if (!user) {
        return errorResponse('Authentication required', 401);
    }

    if (!isAdmin(user)) {
        return errorResponse('Admin access required', 403);
    }

    return null; // User is authorized
}

/**
 * Get user with admin validation (throws if not admin)
 */
export function getAdminUser(context: APIContext) {
    const response = requireAdmin(context);
    if (response) {
        throw new Error('Unauthorized');
    }
    
    return context.locals.user!;
}

/**
 * Check if user can access specific resource
 * Currently: Admin can access everything, Clients can only access their own resources
 */
export function canAccessResource(
    user: SessionUser, 
    resourceUserId?: string,
    action: 'read' | 'write' | 'delete' = 'read'
): boolean {
    // Admin can access everything
    if (isAdmin(user)) {
        return true;
    }

    // Clients can only access their own resources
    if (user.role === 'client') {
        // Only allow read access to own resources
        if (action === 'read' && resourceUserId === user.id) {
            return true;
        }
        
        // Limited write/delete access for own resources
        if ((action === 'write' || action === 'delete') && resourceUserId === user.id) {
            // Add more granular permissions here as needed
            return true;
        }
    }

    return false;
}

/**
 * Middleware-like validation for API routes
 */
export function validateAdminAccess(context: APIContext): {
    isAuthorized: boolean;
    response?: Response;
    user?: SessionUser;
} {
    const user = context.locals.user;

    if (!user) {
        return {
            isAuthorized: false,
            response: errorResponse('Authentication required', 401)
        };
    }

    if (!isAdmin(user)) {
        return {
            isAuthorized: false,
            response: errorResponse('Admin access required', 403)
        };
    }

    return {
        isAuthorized: true,
        user
    };
}

/**
 * Role-based route protection configuration
 */
export const ADMIN_ROUTES = {
    // Full admin access required
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    USER_CREATE: '/api/admin/users',
    USER_UPDATE: '/api/admin/users',
    USER_DELETE: '/api/admin/users',
    PROJECTS: '/api/admin/projects',
    POSTS: '/api/admin/posts',
    PAGES: '/api/admin/pages',
    TEMPLATES: '/api/admin/templates',
} as const;

/**
 * Check if route requires admin access
 */
export function requiresAdminAccess(pathname: string): boolean {
    return Object.values(ADMIN_ROUTES).some(route => 
        pathname.startsWith(route)
    );
}