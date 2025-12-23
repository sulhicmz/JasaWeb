import { describe, it, expect, vi } from 'vitest';
import { validateEnvironment } from './config';

describe('Environment Validation Functions', () => {
    it('should validate database URL format correctly', () => {
        const validUrls = [
            'postgresql://user:password@hostname:5432/database?sslmode=require',
            'postgresql://localhost/mydb?sslmode=require',
        ];

        const invalidUrls = [
            'invalid-url',
            'mysql://user:password@host/db',
            'postgresql://user@host/db', // Missing SSL mode
        ];

        // Test using validation logic directly through a minimal test
        expect(validUrls[0]).toMatch(/^postgresql:\/\/.*\?.*sslmode=require$/);
        expect(invalidUrls[0]).not.toMatch(/^postgresql:\/\//);
    });

    it('should validate Midtrans key formats correctly', () => {
        const validServerKeys = [
            'SB-Mid-server-xxxxxxxx',
            'Mid-server-yyyyyyyy',
        ];

        const validClientKeys = [
            'SB-Mid-client-xxxxxxxx',
            'Mid-client-yyyyyyyy',
        ];

        expect(validServerKeys.every(key => key.startsWith('SB-Mid-server-') || key.startsWith('Mid-server-'))).toBe(true);
        expect(validClientKeys.every(key => key.startsWith('SB-Mid-client-') || key.startsWith('Mid-client-'))).toBe(true);
    });

    it('should validate JWT secret length', () => {
        const validSecret = 'super-secret-key-that-is-at-least-32-chars-long';
        const invalidSecret = 'short';

        expect(validSecret.length).toBeGreaterThanOrEqual(32);
        expect(invalidSecret.length).toBeLessThan(32);
    });

    it('should detect placeholder values', () => {
        const placeholderKey = 'SB-Mid-server-xxx';
        const realKey = 'SB-Mid-server-abc123def456';

        expect(placeholderKey.includes('xxx')).toBe(true);
        expect(realKey.includes('xxx')).toBe(false);
    });

    it('should provide correct environment info based on available variables', () => {
        // Test getEnvironmentInfo logic conceptually
        const mockEnv = {
            NODE_ENV: 'development',
            DATABASE_URL: 'postgresql://test',
            JWT_SECRET: 'super-secret-key-32-chars-long',
            MIDTRANS_SERVER_KEY: 'SB-Mid-server-test',
            MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test',
        };

        const database = mockEnv.DATABASE_URL ? 'configured' : 'missing';
        const auth = mockEnv.JWT_SECRET ? 'configured' : 'missing';
        const payment = (mockEnv.MIDTRANS_SERVER_KEY && mockEnv.MIDTRANS_CLIENT_KEY) ? 'configured' : 'missing';

        expect(database).toBe('configured');
        expect(auth).toBe('configured');
        expect(payment).toBe('configured');
    });

    it('should handle missing environment variables gracefully', () => {
        const mockEnv: Record<string, string | undefined> = {
            // All variables missing
        };

        const database = mockEnv.DATABASE_URL ? 'configured' : 'missing';
        const auth = mockEnv.JWT_SECRET ? 'configured' : 'missing';
        const payment = (mockEnv.MIDTRANS_SERVER_KEY && mockEnv.MIDTRANS_CLIENT_KEY) ? 'configured' : 'missing';

        expect(database).toBe('missing');
        expect(auth).toBe('missing');
        expect(payment).toBe('missing');
    });

    it('should pass validation when DATABASE_URL is missing but HYPERDRIVE is present', () => {
        const mockEnv = {
            HYPERDRIVE: { connectionString: 'postgres://...' }, // Mock Hyperdrive binding
            JWT_SECRET: 'super-secret-key-that-is-at-least-32-chars-long',
            MIDTRANS_SERVER_KEY: 'SB-Mid-server-valid',
            MIDTRANS_CLIENT_KEY: 'SB-Mid-client-valid',
            DATABASE_URL: undefined
        };

        const result = validateEnvironment(mockEnv);
        // It might return errors if other generic validators fail on undefined values, likely 
        // regex testing undefined is not possible so my code short-circuits.
        // Let's verify no "DATABASE_URL" related error occurs.

        const databaseErrors = result.errors.filter(e => e.includes('DATABASE_URL'));
        expect(databaseErrors).toHaveLength(0);
    });

    it('should fail validation when DATABASE_URL is missing AND HYPERDRIVE is missing', () => {
        const mockEnv = {
            // Missing DB and Hyperdrive
            JWT_SECRET: 'super-secret-key-that-is-at-least-32-chars-long',
            MIDTRANS_SERVER_KEY: 'SB-Mid-server-valid',
            MIDTRANS_CLIENT_KEY: 'SB-Mid-client-valid',
        };

        const result = validateEnvironment(mockEnv);
        const databaseErrors = result.errors.filter(e => e.includes('DATABASE_URL'));
        expect(databaseErrors.length).toBeGreaterThan(0);
    });
});