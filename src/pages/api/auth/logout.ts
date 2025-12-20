/**
 * Logout API
 * Clears auth cookie
 */
import type { APIRoute } from 'astro';
import { AUTH_COOKIE } from '@/lib/auth';
import { handleApiError } from '@/lib/api';

export const POST: APIRoute = async ({ cookies, redirect }) => {
    try {
        // Clear the auth cookie
        cookies.delete(AUTH_COOKIE, { path: '/' });

        // Redirect to login page
        return redirect('/login');
    } catch (error) {
        return handleApiError(error);
    }
};
