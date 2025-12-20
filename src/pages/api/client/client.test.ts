/**
 * Client Portal API Routes Test Suite
 * Tests all client portal endpoints: dashboard, projects, profile, password
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies before importing routes
const mockPrisma = {
    user: {
        findUnique: vi.fn(),
        update: vi.fn()
    },
    project: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn()
    },
    invoice: {
        count: vi.fn()
    }
};

const mockAuthFunctions = vi.hoisted(() => ({
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
}));

const mockCheckRateLimit = vi.fn(() => null);

vi.mock('@/lib/prisma', () => ({
    getPrisma: vi.fn(() => mockPrisma)
}));

vi.mock('@/lib/auth', () => ({
    hashPassword: mockAuthFunctions.hashPassword,
    verifyPassword: mockAuthFunctions.verifyPassword,
    AUTH_COOKIE: 'jasaweb_auth',
}));

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: mockCheckRateLimit,
    RateLimits: { auth: { limit: 5, window: 60 } }
}));

describe('Client Portal API Routes - Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Dashboard Endpoint', () => {
        it('should return dashboard stats for authenticated user', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client'
            };

            mockPrisma.project.count
                .mockResolvedValueOnce(5) // totalProjects
                .mockResolvedValueOnce(2) // inProgress
                .mockResolvedValueOnce(3); // completed
            
            mockPrisma.invoice.count.mockResolvedValue(1); // unpaidInvoices

            const { GET: dashboardHandler } = await import('@/pages/api/client/dashboard');

            const mockLocals = { 
                user: mockUser,
                runtime: { env: {} }
            };

            // Act
            const response = await dashboardHandler({ locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(200);
            
            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                totalProjects: 5,
                inProgress: 2,
                completed: 3,
                unpaidInvoices: 1,
            });

            expect(mockPrisma.project.count).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
            expect(mockPrisma.project.count).toHaveBeenCalledWith({ 
                where: { userId: 'user-123', status: 'in_progress' } 
            });
            expect(mockPrisma.project.count).toHaveBeenCalledWith({ 
                where: { userId: 'user-123', status: 'completed' } 
            });
            expect(mockPrisma.invoice.count).toHaveBeenCalledWith({
                where: {
                    project: { userId: 'user-123' },
                    status: 'unpaid',
                },
            });
        });

        it('should reject unauthenticated requests', async () => {
            // Arrange
            const { GET: dashboardHandler } = await import('@/pages/api/client/dashboard');
            const mockLocals = { user: null, runtime: { env: {} } };

            // Act
            const response = await dashboardHandler({ locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });
    });

    describe('Projects Endpoint', () => {
        it('should return user projects', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client'
            };

            const mockProjects = [
                {
                    id: 'project-1',
                    name: 'Company Website',
                    type: 'company',
                    status: 'in_progress',
                    url: null,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-15')
                },
                {
                    id: 'project-2',
                    name: 'School Portal',
                    type: 'sekolah',
                    status: 'completed',
                    url: 'https://school.example.com',
                    createdAt: new Date('2023-12-01'),
                    updatedAt: new Date('2024-01-10')
                }
            ];

            mockPrisma.project.findMany.mockResolvedValue(mockProjects);

            const { GET: projectsHandler } = await import('@/pages/api/client/projects');
            const mockLocals = { user: mockUser, runtime: { env: {} } };

            // Act
            const response = await projectsHandler({ locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(200);
            
            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('Company Website');
            expect(result.data[1].status).toBe('completed');

            expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    url: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });
        });

        it('should reject unauthenticated requests', async () => {
            // Arrange
            const { GET: projectsHandler } = await import('@/pages/api/client/projects');
            const mockLocals = { user: null, runtime: { env: {} } };

            // Act
            const response = await projectsHandler({ locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });
    });

    describe('Profile Endpoint', () => {
        it('should return user profile', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client',
                phone: '+1234567890',
                createdAt: new Date('2024-01-01')
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const { GET: profileHandler } = await import('@/pages/api/client/profile');
            const mockLocals = { user: mockUser, runtime: { env: {} } };

            // Act
            const response = await profileHandler({ locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(200);
            
            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client',
                phone: '+1234567890',
                createdAt: mockUser.createdAt.toISOString()
            });
        });

        it('should update user profile', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client'
            };

            const updatedUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Updated Name',
                role: 'client',
                phone: '+9876543210',
                createdAt: new Date('2024-01-01')
            };

            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const { PUT: profileUpdateHandler } = await import('@/pages/api/client/profile');
            const mockLocals = { user: mockUser, runtime: { env: {} } };

            const request = new Request('http://localhost/api/client/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Updated Name',
                    phone: '+9876543210'
                })
            });

            // Act
            const response = await profileUpdateHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(200);
            
            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data.message).toBe('Profil berhasil diperbarui');
            expect(result.data.user.name).toBe('Updated Name');
            expect(result.data.user.phone).toBe('+9876543210');

            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: {
                    name: 'Updated Name',
                    phone: '+9876543210'
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                }
            });
        });

        it('should reject unauthenticated requests', async () => {
            // Arrange
            const { GET: profileHandler } = await import('@/pages/api/client/profile');
            const mockLocals = { user: null, runtime: { env: {} } };

            // Act
            const response = await profileHandler({ locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });
    });

    describe('Password Change Endpoint', () => {
        it('should change password successfully', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client',
                password: 'old-hashed-password'
            };

            const currentUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client',
                password: 'old-hashed-password'
            };

            mockAuthFunctions.verifyPassword.mockResolvedValue(true);
            mockAuthFunctions.hashPassword.mockResolvedValue('new-hashed-password');

            mockPrisma.user.findUnique.mockResolvedValue(currentUser);
            mockPrisma.user.update.mockResolvedValue({
                id: 'user-123',
                name: 'Test Client',
                email: 'client@example.com'
            });

            const { PUT: passwordHandler } = await import('@/pages/api/client/password');
            const mockLocals = { user: mockUser, runtime: { env: {} } };

            const request = new Request('http://localhost/api/client/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: 'oldpassword',
                    newPassword: 'newpassword123'
                })
            });

            // Act
            const response = await passwordHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(200);
            
            const result = await response.json();
            expect(result.success).toBe(true);
            expect(result.data.message).toBe('Password berhasil diubah');

            expect(mockAuthFunctions.verifyPassword).toHaveBeenCalledWith('oldpassword', 'old-hashed-password');
            expect(mockAuthFunctions.hashPassword).toHaveBeenCalledWith('newpassword123');
        });

        it('should reject invalid current password', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client',
                password: 'old-hashed-password'
            };

            const currentUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client',
                password: 'old-hashed-password'
            };

            mockPrisma.user.findUnique.mockResolvedValue(currentUser);
            mockAuthFunctions.verifyPassword.mockResolvedValue(false);

            const { PUT: passwordHandler } = await import('@/pages/api/client/password');
            const mockLocals = { user: mockUser, runtime: { env: {} } };

            const request = new Request('http://localhost/api/client/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123'
                })
            });

            // Act
            const response = await passwordHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Password saat ini salah');
        });

        it('should validate password length', async () => {
            // Arrange
            const mockUser = {
                id: 'user-123',
                email: 'client@example.com',
                name: 'Test Client',
                role: 'client',
                password: 'old-hashed-password'
            };

            const { PUT: passwordHandler } = await import('@/pages/api/client/password');
            const mockLocals = { user: mockUser, runtime: { env: {} } };

            const request = new Request('http://localhost/api/client/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: 'oldpassword',
                    newPassword: '123' // too short
                })
            });

            // Act
            const response = await passwordHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Password baru minimal 8 karakter');
        });

        it('should reject unauthenticated requests', async () => {
            // Arrange
            const { PUT: passwordHandler } = await import('@/pages/api/client/password');
            const mockLocals = { user: null, runtime: { env: {} } };

            const request = new Request('http://localhost/api/client/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: 'oldpassword',
                    newPassword: 'newpassword123'
                })
            });

            // Act
            const response = await passwordHandler({ request, locals: mockLocals } as any);

            // Assert
            expect(response.status).toBe(401);
            const data = await response.json();
            expect(data.error).toBe('Unauthorized');
        });
    });
});