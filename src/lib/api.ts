/**
 * API Response Utilities
 * Standardized responses for all API endpoints with comprehensive error codes
 */

import type { ApiResponse, PaginatedResponse, ApiErrorDetails } from './types';

// ==============================================
// ERROR CODES
// ==============================================

/**
 * Standardized API error codes
 */
export enum ApiErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
    PAYMENT_ERROR = 'PAYMENT_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    CACHE_ERROR = 'CACHE_ERROR',
}

/**
 * Error severity levels
 */
export enum ApiErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

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
 * Create an error response with code and details
 */
export function detailedErrorResponse(
    code: ApiErrorCode,
    message: string,
    status = 400,
    details?: Partial<ApiErrorDetails>
): Response {
    const errorDetails: ApiErrorDetails = {
        code,
        severity: details?.severity || ApiErrorSeverity.MEDIUM,
        retryable: details?.retryable || false,
        requestId: generateRequestId(),
        ...details,
    };

    const body: ApiResponse<null> = {
        success: false,
        error: message,
        errorDetails,
    };

    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
    field: string,
    message: string,
    details?: Partial<ApiErrorDetails>
): Response {
    return detailedErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        message,
        400,
        {
            field,
            severity: ApiErrorSeverity.LOW,
            ...details,
        }
    );
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedErrorResponse(
    message = 'Unauthorized access',
    details?: Partial<ApiErrorDetails>
): Response {
    return detailedErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        message,
        401,
        {
            severity: ApiErrorSeverity.HIGH,
            retryable: false,
            ...details,
        }
    );
}

/**
 * Create a forbidden error response
 */
export function forbiddenErrorResponse(
    message = 'Access forbidden',
    details?: Partial<ApiErrorDetails>
): Response {
    return detailedErrorResponse(
        ApiErrorCode.FORBIDDEN,
        message,
        403,
        {
            severity: ApiErrorSeverity.HIGH,
            retryable: false,
            ...details,
        }
    );
}

/**
 * Create a not found error response
 */
export function notFoundErrorResponse(
    resource: string,
    details?: Partial<ApiErrorDetails>
): Response {
    return detailedErrorResponse(
        ApiErrorCode.NOT_FOUND,
        `${resource} not found`,
        404,
        {
            severity: ApiErrorSeverity.LOW,
            retryable: false,
            ...details,
        }
    );
}

/**
 * Create a conflict error response
 */
export function conflictErrorResponse(
    message: string,
    details?: Partial<ApiErrorDetails>
): Response {
    return detailedErrorResponse(
        ApiErrorCode.CONFLICT,
        message,
        409,
        {
            severity: ApiErrorSeverity.MEDIUM,
            retryable: false,
            ...details,
        }
    );
}

/**
 * Create a rate limit exceeded error response
 */
export function rateLimitErrorResponse(
    message = 'Rate limit exceeded',
    details?: Partial<ApiErrorDetails>
): Response {
    return detailedErrorResponse(
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
        message,
        429,
        {
            severity: ApiErrorSeverity.MEDIUM,
            retryable: true,
            ...details,
        }
    );
}

/**
 * Create an internal error response
 */
export function internalErrorResponse(
    message = 'Internal server error',
    details?: Partial<ApiErrorDetails>
): Response {
    return detailedErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        message,
        500,
        {
            severity: ApiErrorSeverity.CRITICAL,
            retryable: true,
            ...details,
        }
    );
}

/**
 * Create a service unavailable error response
 */
export function serviceUnavailableErrorResponse(
    message = 'Service temporarily unavailable',
    details?: Partial<ApiErrorDetails>
): Response {
    return detailedErrorResponse(
        ApiErrorCode.SERVICE_UNAVAILABLE,
        message,
        503,
        {
            severity: ApiErrorSeverity.HIGH,
            retryable: true,
            ...details,
        }
    );
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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
export async function parseBody<T = Record<string, unknown>>(request: Request): Promise<T | null> {
    try {
        return await request.json() as T;
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
