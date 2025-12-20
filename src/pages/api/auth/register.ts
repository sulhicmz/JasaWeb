/**
 * Register API Endpoint
 * REFACTORED: Uses standardized api.ts utilities per AGENTS.md
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import {
    jsonResponse,
    errorResponse,
    handleApiError,
    parseBody
} from '@/lib/api';
import type { RegisterForm } from '@/lib/types';
import { ValidationService } from '@/services/validation/ValidationService';

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // Rate Limiting
        if (locals.runtime?.env?.CACHE) {
            const limitResult = await checkRateLimit(
                request,
                locals.runtime.env.CACHE,
                'register',
                RateLimits.auth
            );
            if (limitResult) return limitResult;
        }

        const body = await parseBody<RegisterForm>(request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        // Validate required fields and format using ValidationService
        const validation = ValidationService.validateCommon(body, {
            required: ['name', 'email', 'password'],
            email: 'email',
            password: 'password',
            minLength: {
                name: 3
            }
        });
        if (!validation.success) {
            return errorResponse(validation.error || 'Validasi gagal');
        }

        const prisma = getPrisma(locals);

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: body.email },
        });

        if (existingUser) {
            return errorResponse('Email sudah terdaftar');
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(body.password);

        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                phone: body.phone || null,
                password: hashedPassword,
                role: 'client',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return jsonResponse({ message: 'Registrasi berhasil', user }, 201);
    } catch (error) {
        return handleApiError(error);
    }
};
