/**
 * API Response Utilities
 * Standardized responses for all API endpoints
 */

import type { ApiResponse, PaginatedResponse } from './types';

// ==============================================
// RESPONSE BUILDERS
// ==============================================

/**
 * Create a successful JSON response
 */
export function jsonResponse<T>(data: T, status = 200): Response {
    const body: ApiResponse<T> = {
        success: true,
        data,
    };

    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Create a success message response
 */
export function successResponse(message: string, status = 200): Response {
    const body: ApiResponse = {
        success: true,
        message,
    };

    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Create an error response
 */
export function errorResponse(error: string, status = 400): Response {
    const body: ApiResponse = {
        success: false,
        error,
    };

    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): Response {
    const body: PaginatedResponse<T> = {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };

    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}

// ==============================================
// VALIDATION HELPERS
// ==============================================

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, unknown>>(
    body: T,
    requiredFields: (keyof T)[]
): string | null {
    for (const field of requiredFields) {
        if (!body[field]) {
            return `${String(field)} wajib diisi`;
        }
    }
    return null;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Parse and validate request body
 */
export async function parseBody(request: Request): Promise<Record<string, unknown> | null> {
    try {
        return await request.json() as Record<string, unknown>;
    } catch {
        return null;
    }
}

// ==============================================
// ERROR HANDLING
// ==============================================

/**
 * Handle common API errors
 */
export function handleApiError(error: unknown): Response {
    console.error('API Error:', error);

    if (error instanceof Error) {
        // Don't expose internal errors to clients
        return errorResponse('Terjadi kesalahan server', 500);
    }

    return errorResponse('Terjadi kesalahan yang tidak terduga', 500);
}
