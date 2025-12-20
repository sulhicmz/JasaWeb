import { describe, it, expect } from 'vitest';
import { validateRequired, isValidEmail, isValidPhone, errorResponse, jsonResponse } from './api';

describe('API Utilities', () => {
    describe('validateRequired', () => {
        it('should return null when all required fields are present', () => {
            const body = { name: 'John', email: 'john@example.com' };
            const result = validateRequired(body, ['name', 'email']);
            expect(result).toBeNull();
        });

        it('should return error string when a field is missing', () => {
            const body = { name: 'John' };
            const result = validateRequired(body as any, ['name', 'email']);
            expect(result).toBe('email wajib diisi');
        });
    });

    describe('isValidEmail', () => {
        it('should return true for valid emails', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.co.id')).toBe(true);
        });

        it('should return false for invalid emails', () => {
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('test@')).toBe(false);
            expect(isValidEmail('')).toBe(false);
        });
    });

    describe('isValidPhone', () => {
        it('should return true for valid Indonesian numbers', () => {
            expect(isValidPhone('081234567890')).toBe(true);
            expect(isValidPhone('6281234567890')).toBe(true);
            expect(isValidPhone('+6281234567890')).toBe(true);
        });

        it('should return false for invalid numbers', () => {
            expect(isValidPhone('123456')).toBe(false);
            expect(isValidPhone('07123456789')).toBe(false); // Not 08 prefix
        });
    });

    describe('Response Helpers', () => {
        it('jsonResponse should create correct Response object', async () => {
            const data = { foo: 'bar' };
            const res = jsonResponse(data);
            expect(res).toBeInstanceOf(Response);
            expect(res.status).toBe(200);

            const body = await res.json();
            expect(body).toEqual({ success: true, data });
        });

        it('errorResponse should create correct Response object', async () => {
            const error = 'Something went wrong';
            const res = errorResponse(error, 400);
            expect(res).toBeInstanceOf(Response);
            expect(res.status).toBe(400);

            const body = await res.json();
            expect(body).toEqual({ success: false, error });
        });
    });
});
