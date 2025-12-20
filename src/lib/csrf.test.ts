/**
 * CSRF Protection Tests
 */

import { describe, it, expect } from 'vitest';
import { generateCsrfToken, validateCsrfToken } from './auth';

describe('CSRF Protection', () => {
    describe('generateCsrfToken', () => {
        it('should generate unique tokens', () => {
            const token1 = generateCsrfToken();
            const token2 = generateCsrfToken();
            
            expect(token1).not.toBe(token2);
            expect(token1).toMatch(/^[a-f0-9]{64}$/);
            expect(token2).toMatch(/^[a-f0-9]{64}$/);
        });

        it('should generate tokens with correct length', () => {
            const token = generateCsrfToken();
            expect(token).toHaveLength(64); // 32 bytes * 2 hex chars
        });
    });

    describe('validateCsrfToken', () => {
        it('should validate matching tokens', () => {
            const token = generateCsrfToken();
            expect(validateCsrfToken(token, token)).toBe(true);
        });

        it('should reject non-matching tokens', () => {
            const token1 = generateCsrfToken();
            const token2 = generateCsrfToken();
            expect(validateCsrfToken(token1, token2)).toBe(false);
        });

        it('should reject null header token', () => {
            const cookieToken = generateCsrfToken();
            expect(validateCsrfToken(null, cookieToken)).toBe(false);
        });

        it('should reject null cookie token', () => {
            const headerToken = generateCsrfToken();
            expect(validateCsrfToken(headerToken, null)).toBe(false);
        });

        it('should reject both null tokens', () => {
            expect(validateCsrfToken(null, null)).toBe(false);
        });

        it('should reject empty string tokens', () => {
            expect(validateCsrfToken('', 'valid-token')).toBe(false);
            expect(validateCsrfToken('valid-token', '')).toBe(false);
            expect(validateCsrfToken('', '')).toBe(false);
        });
    });
});