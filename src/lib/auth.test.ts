import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken, extractBearerToken, getAuthCookieOptions } from './auth';

describe('Auth Service', () => {
    const secret = 'test-secret-key-that-is-long-enough';
    const payload = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test Agent',
        role: 'client' as const
    };

    describe('Password Hashing', () => {
        it('should hash password and verify it correctly', async () => {
            const password = 'my-secure-password';
            const hash = await hashPassword(password);

            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(20);

            const isValid = await verifyPassword(password, hash);
            expect(isValid).toBe(true);

            const isInvalid = await verifyPassword('wrong-password', hash);
            expect(isInvalid).toBe(false);
        });
    });

    describe('JWT Token', () => {
        it('should generate and verify a valid token', async () => {
            const token = await generateToken(payload, secret);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');

            const decoded = await verifyToken(token, secret);
            expect(decoded).toEqual(payload);
        });

        it('should return null for invalid token', async () => {
            const result = await verifyToken('invalid.token.here', secret);
            expect(result).toBeNull();
        });

        it('should return null for expired or tampered token', async () => {
            const token = await generateToken(payload, secret);
            const tamperedToken = token + 'tamper';
            const result = await verifyToken(tamperedToken, secret);
            expect(result).toBeNull();
        });
    });

    describe('Utilities', () => {
        it('extractBearerToken should correctly parse header', () => {
            expect(extractBearerToken('Bearer my-token')).toBe('my-token');
            expect(extractBearerToken('Bearer ')).toBe('');
            expect(extractBearerToken('Invalid-Header')).toBeNull();
            expect(extractBearerToken(null)).toBeNull();
        });

        it('getAuthCookieOptions should return correct options', () => {
            const prodOptions = getAuthCookieOptions(true);
            expect(prodOptions.secure).toBe(true);
            expect(prodOptions.httpOnly).toBe(true);
            expect(prodOptions.sameSite).toBe('lax');

            const devOptions = getAuthCookieOptions(false);
            expect(devOptions.secure).toBe(false);
        });
    });
});
