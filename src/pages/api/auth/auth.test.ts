/**
 * API Routes Integration Test Suite - Authentication Endpoints
 * Tests the actual authentication endpoints with proper mocking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies before importing routes
const mockPrisma = {
    user: {
        findUnique: vi.fn(),
        create: vi.fn()
    }
};

const mockHashPassword = vi.fn();
const mockVerifyPassword = vi.fn();
const mockGenerateToken = vi.fn();
const mockCheckRateLimit = vi.fn<() => Promise<Response | null>>();

vi.mock('@/lib/prisma', () => ({
    getPrisma: vi.fn(() => mockPrisma)
}));

vi.mock('@/lib/auth', () => ({
    verifyPassword: mockVerifyPassword,
    hashPassword: mockHashPassword,
    generateToken: mockGenerateToken,
    AUTH_COOKIE: 'jasaweb_auth',
    getAuthCookieOptions: vi.fn(() => ({ httpOnly: true, secure: false }))
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: mockCheckRateLimit,
    RateLimits: { auth: { limit: 5, window: 60 } }
}));

describe('Authentication API Routes - Integration', () => {
    let mockEnv: any;
    let mockLocals: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockEnv = {
            JWT_SECRET: 'test-secret',
            NODE_ENV: 'test'
        };

        mockLocals = {
            runtime: { env: mockEnv }
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Registration Endpoint', () => {
        it('should register new user successfully', async () => {
            // Arrange
            mockHashPassword.mockResolvedValue('hashed-password');
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com',
                role: 'client'
            });

            // Import handler after mocks are set up
            const { POST: registerHandler } = await import('@/pages/api/auth/register');

            const request = new Request('http://localhost/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    phone: '+1234567890'
                })
            });

            // Act
            const response = await registerHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(201);
            
            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data.message).toBe('Registrasi berhasil');
            expect(result.data.user.email).toBe('test@example.com');
            
            expect(mockHashPassword).toHaveBeenCalledWith('password123');
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '+1234567890',
                    password: 'hashed-password',
                    role: 'client'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            });
        });

        it('should reject invalid email format', async () => {
            // Arrange
            const { POST: registerHandler } = await import('@/pages/api/auth/register');

            const request = new Request('http://localhost/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'invalid-email',
                    password: 'password123'
                })
            });

            // Act
            const response = await registerHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Format email tidak valid');
        });

        it('should reject short password', async () => {
            // Arrange
            const { POST: registerHandler } = await import('@/pages/api/auth/register');

            const request = new Request('http://localhost/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: '123' // too short
                })
            });

            // Act
            const response = await registerHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Password minimal 8 karakter');
        });

        it('should reject duplicate email', async () => {
            // Arrange
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                email: 'test@example.com'
            });

            const { POST: registerHandler } = await import('@/pages/api/auth/register');

            const request = new Request('http://localhost/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                })
            });

            // Act
            const response = await registerHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Email sudah terdaftar');
        });
    });

    describe('Login Endpoint', () => {
        it('should handle successful login', async () => {
            // Arrange
            const loginUser = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashed-password',
                role: 'client'
            };

            mockVerifyPassword.mockResolvedValue(true);
            mockGenerateToken.mockResolvedValue('jwt-token');
            mockPrisma.user.findUnique.mockResolvedValue(loginUser);

            const { POST: loginHandler } = await import('@/pages/api/auth/login');

            const request = new Request('http://localhost/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123'
                })
            });

            const cookies = new Map();
            const mockCookies = {
                set: vi.fn((key, value, options) => cookies.set(key, { value, options }))
            };

            // Act
            const response = await loginHandler({ request, locals: mockLocals, cookies: mockCookies } as any);

            // Assert
            expect(response.status).toBe(200);
            
            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data.message).toBe('Login berhasil');
            expect(result.data.user.email).toBe('test@example.com');
            
            expect(mockVerifyPassword).toHaveBeenCalledWith('password123', 'hashed-password');
            expect(mockGenerateToken).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: loginUser.id,
                    email: loginUser.email
                }),
                'test-secret'
            );
            
            expect(mockCookies.set).toHaveBeenCalledWith(
                'jasaweb_auth',
                'jwt-token',
                expect.objectContaining({ httpOnly: true })
            );
        });

        it('should reject invalid credentials', async () => {
            // Arrange
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashed-password',
                role: 'client'
            };

            mockVerifyPassword.mockResolvedValue(false);
            mockPrisma.user.findUnique.mockResolvedValue(user);

            const { POST: loginHandler } = await import('@/pages/api/auth/login');

            const request = new Request('http://localhost/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
            });

            // Act
            const response = await loginHandler({ request, locals: mockLocals, cookies: {} } as any);

            // Assert
            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Email atau password salah');
        });

        it('should handle non-existent user', async () => {
            // Arrange
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const { POST: loginHandler } = await import('@/pages/api/auth/login');

            const request = new Request('http://localhost/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                })
            });

            // Act
            const response = await loginHandler({ request, locals: mockLocals, cookies: {} } as any);

            // Assert
            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Email atau password salah');
        });
    });

    describe('Logout Endpoint', () => {
        it('should logout successfully', async () => {
            // Arrange
            const { POST: logoutHandler } = await import('@/pages/api/auth/logout');

            const mockCookies = {
                delete: vi.fn()
            };

            const mockRedirect = vi.fn().mockReturnValue(new Response(null, { status: 302 }));

            // Act
            await logoutHandler({ 
                cookies: mockCookies, 
                redirect: mockRedirect 
            } as any);

            // Assert
            expect(mockCookies.delete).toHaveBeenCalledWith('jasaweb_auth', { path: '/' });
            expect(mockRedirect).toHaveBeenCalledWith('/login');
        });
    });

    describe('Security Features', () => {
        it('should apply rate limiting when exceeded', async () => {
            // Arrange - Mock the actual errorResponse from rate limiting
            const mockRateLimitResponse = new Response(
                JSON.stringify({ success: false, error: 'Too many requests, please try again later.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
            
            mockCheckRateLimit.mockResolvedValue(mockRateLimitResponse);

            // Add CACHE to mock environment for rate limiting
            mockLocals.runtime.env.CACHE = {
                get: vi.fn(),
                put: vi.fn()
            } as any;

            const { POST: loginHandler } = await import('@/pages/api/auth/login');

            const request = new Request('http://localhost/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123'
                })
            });

            // Act
            const response = await loginHandler({ request, locals: mockLocals, cookies: {} } as any);

            // Assert
            expect(response.status).toBe(429);
        });

        it('should validate required fields - missing email', async () => {
            // Arrange
            const { POST: registerHandler } = await import('@/pages/api/auth/register');

            const request = new Request('http://localhost/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User'
                    // missing email, password
                })
            });

            // Act
            const response = await registerHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toMatch(/wajib diisi/);
        });
    });
});