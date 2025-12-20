/**
 * Login API Endpoint
 * REFACTORED: Uses standardized api.ts utilities per AGENTS.md
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { verifyPassword, generateToken, AUTH_COOKIE, getAuthCookieOptions } from '@/lib/auth';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import {
    jsonResponse,
    errorResponse,
    validateRequired,
    handleApiError,
    parseBody
} from '@/lib/api';
import type { LoginForm } from '@/lib/types';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
    try {
        // Rate Limiting
        if (locals.runtime?.env?.CACHE) {
            const limitResult = await checkRateLimit(
                request,
                locals.runtime.env.CACHE,
                'login',
                RateLimits.auth
            );
            if (limitResult) return limitResult;
        }

        const body = await parseBody<LoginForm>(request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        // Validate required fields
        const validationError = validateRequired(body as any, ['email', 'password']);
        if (validationError) {
            return errorResponse(validationError);
        }

        const prisma = getPrisma(locals);
        const env = locals.runtime.env;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: body.email },
        });

        if (!user) {
            return errorResponse('Email atau password salah', 401);
        }

        // Verify password
        const isValid = await verifyPassword(body.password, user.password);

        if (!isValid) {
            return errorResponse('Email atau password salah', 401);
        }

        // Generate JWT token
        const token = await generateToken(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role as 'admin' | 'client',
            },
            env.JWT_SECRET
        );

        // Set auth cookie
        const isProduction = env.NODE_ENV === 'production';
        cookies.set(AUTH_COOKIE, token, getAuthCookieOptions(isProduction));

        return jsonResponse({
            message: 'Login berhasil',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
};
