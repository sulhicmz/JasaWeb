import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

/**
 * JWT Authentication Service
 */

const SALT_ROUNDS = 10;
const JWT_EXPIRY = '7d';

export interface JwtPayload {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'client';
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export async function generateToken(
    payload: JwtPayload,
    secret: string
): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);

    return await new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(secretKey);
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(
    token: string,
    secret: string
): Promise<JwtPayload | null> {
    try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, secretKey);

        return {
            id: payload.id as string,
            email: payload.email as string,
            name: payload.name as string,
            role: payload.role as 'admin' | 'client',
        };
    } catch {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(header: string | null): string | null {
    if (!header?.startsWith('Bearer ')) {
        return null;
    }
    return header.slice(7);
}

/**
 * Cookie name for auth token
 */
export const AUTH_COOKIE = 'jasaweb_auth';

/**
 * Cookie name for CSRF token
 */
export const CSRF_COOKIE = 'jasaweb_csrf';

/**
 * Create auth cookie options
 */
export function getAuthCookieOptions(isProduction: boolean) {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    };
}

/**
 * Create CSRF cookie options (accessible to JavaScript)
 */
export function getCsrfCookieOptions(isProduction: boolean) {
    return {
        httpOnly: false, // Must be accessible to JS
        secure: isProduction,
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    };
}

/**
 * Generate secure random CSRF token
 */
export function generateCsrfToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token against cookie value
 */
export function validateCsrfToken(headerToken: string | null, cookieToken: string | null): boolean {
    if (!headerToken || !cookieToken) {
        return false;
    }
    return headerToken === cookieToken;
}
