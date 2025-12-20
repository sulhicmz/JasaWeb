/**
 * Admin API Tests
 * Comprehensive test coverage for admin endpoints and services
 * Following existing patterns in the codebase
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAdminService } from './users';
import { requireAdmin, validateAdminAccess, isAdmin, canAccessResource } from './auth';

// Mock Prisma Client
const mockPrisma = {
    user: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    },
    project: {
        count: vi.fn(),
        findMany: vi.fn()
    },
    invoice: {
        count: vi.fn(),
        aggregate: vi.fn()
    }
} as any;

// Mock user data
const mockAdminUser = {
    id: 'admin-123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin' as const,
    phone: null,
    createdAt: new Date()
};

const mockClientUser = {
    id: 'client-123',
    name: 'Client User',
    email: 'client@example.com',
    role: 'client' as const,
    phone: '+62 812 3456 7890',
    createdAt: new Date()
};

describe('Admin Services', () => {
    let adminService: ReturnType<typeof createAdminService>;

    beforeEach(() => {
        vi.clearAllMocks();
        adminService = createAdminService(mockPrisma);
    });

    describe('AdminUserService', () => {
        describe('getDashboardStats', () => {
            it('should return dashboard statistics', async () => {
                // Mock database responses with specific call sequences
                mockPrisma.user.count
                    .mockResolvedValueOnce(10) // total users
                    .mockResolvedValueOnce(0);  // will be overwritten
                
                mockPrisma.project.count
                    .mockResolvedValueOnce(15) // total projects
                    .mockResolvedValueOnce(5);  // active projects
                    
                mockPrisma.invoice.aggregate.mockResolvedValue({
                    _sum: { amount: 1000000 }
                });
                
                mockPrisma.invoice.count.mockResolvedValue(3);
                mockPrisma.user.findMany.mockResolvedValue([mockAdminUser]);
                mockPrisma.project.findMany.mockResolvedValue([
                    { 
                        id: 'project-1', 
                        name: 'Test Project',
                        user: mockClientUser,
                        createdAt: new Date()
                    }
                ]);

                const stats = await adminService.getDashboardStats();

                expect(stats).toEqual({
                    totalUsers: 10,
                    totalProjects: 15,
                    totalRevenue: 1000000,
                    activeProjects: 5,
                    pendingPayments: 3,
                    recentUsers: [mockAdminUser],
                    recentProjects: expect.any(Array)
                });
            });
        });

        describe('getUsers', () => {
            it('should return paginated users with expected structure', async () => {
                mockPrisma.user.count.mockResolvedValue(1);
                mockPrisma.user.findMany.mockReturnValue([mockAdminUser] as any);

                const result = await adminService.getUsers({
                    page: 1,
                    limit: 10
                });

                expect(result).toHaveProperty('users');
                expect(result).toHaveProperty('total');
                expect(result).toHaveProperty('page', 1);
                expect(result).toHaveProperty('limit', 10);
                expect(result).toHaveProperty('totalPages');
                expect(Array.isArray(result.users)).toBe(true);
            });

            it('should filter users by role', async () => {
                mockPrisma.user.count.mockResolvedValue(1);
                mockPrisma.user.findMany.mockResolvedValue([mockAdminUser]);

                await adminService.getUsers({
                    role: 'admin',
                    page: 1,
                    limit: 10
                });

                expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: { role: 'admin' }
                    })
                );
            });

            it('should search users by name and email', async () => {
                mockPrisma.user.count.mockResolvedValue(1);
                mockPrisma.user.findMany.mockResolvedValue([mockAdminUser]);

                await adminService.getUsers({
                    search: 'admin',
                    page: 1,
                    limit: 10
                });

                expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: {
                            OR: [
                                { name: { contains: 'admin', mode: 'insensitive' } },
                                { email: { contains: 'admin', mode: 'insensitive' } }
                            ]
                        }
                    })
                );
            });
        });

        describe('createUser', () => {
            it('should create a new user', async () => {
                const userData = {
                    name: 'New User',
                    email: 'new@example.com',
                    password: 'password123',
                    role: 'client' as const
                };

                mockPrisma.user.create.mockResolvedValue({
                    ...userData,
                    id: 'new-user-123',
                    phone: null,
                    createdAt: new Date()
                });

                await adminService.createUser(userData);

                expect(mockPrisma.user.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            name: userData.name,
                            email: userData.email,
                            role: userData.role,
                            password: expect.any(String) // Hashed password
                        })
                    })
                );
            });
        });

        describe('updateUser', () => {
            it('should update an existing user', async () => {
                const updateData = {
                    name: 'Updated Name'
                };

                mockPrisma.user.update.mockResolvedValue({
                    ...mockAdminUser,
                    ...updateData
                });

                await adminService.updateUser('admin-123', updateData);

                expect(mockPrisma.user.update).toHaveBeenCalledWith({
                    where: { id: 'admin-123' },
                    data: updateData,
                    select: expect.any(Object)
                });
            });
        });

        describe('deleteUser', () => {
            it('should delete a user without projects', async () => {
                mockPrisma.project.count.mockResolvedValue(0);
                mockPrisma.user.delete.mockResolvedValue(undefined);

                await adminService.deleteUser('user-123');

                expect(mockPrisma.user.delete).toHaveBeenCalledWith({
                    where: { id: 'user-123' }
                });
            });

            it('should throw error when deleting user with projects', async () => {
                mockPrisma.project.count.mockResolvedValue(5);

                await expect(adminService.deleteUser('user-123')).rejects.toThrow(
                    'Cannot delete user with existing projects'
                );
            });
        });
    });
});

describe('Admin Auth Utils', () => {
    describe('isAdmin', () => {
        it('should return true for admin users', () => {
            expect(isAdmin(mockAdminUser)).toBe(true);
        });

        it('should return false for client users', () => {
            expect(isAdmin(mockClientUser)).toBe(false);
        });

        it('should return false for undefined user', () => {
            expect(isAdmin(undefined)).toBe(false);
        });
    });

    describe('requireAdmin', () => {
        it('should return null for valid admin user', () => {
            const mockContext = {
                locals: { user: mockAdminUser }
            } as any;

            const result = requireAdmin(mockContext);
            expect(result).toBeNull();
        });

        it('should return 401 for missing user', () => {
            const mockContext = {
                locals: { user: undefined }
            } as any;

            const result = requireAdmin(mockContext);
            expect(result?.status).toBe(401);
        });

        it('should return 403 for non-admin user', () => {
            const mockContext = {
                locals: { user: mockClientUser }
            } as any;

            const result = requireAdmin(mockContext);
            expect(result?.status).toBe(403);
        });
    });

    describe('validateAdminAccess', () => {
        it('should validate admin access successfully', () => {
            const mockContext = {
                locals: { user: mockAdminUser }
            } as any;

            const result = validateAdminAccess(mockContext);
            expect(result.isAuthorized).toBe(true);
            expect(result.user).toBe(mockAdminUser);
        });

        it('should reject missing authentication', () => {
            const mockContext = {
                locals: { user: undefined }
            } as any;

            const result = validateAdminAccess(mockContext);
            expect(result.isAuthorized).toBe(false);
            expect(result.response?.status).toBe(401);
        });

        it('should reject non-admin access', () => {
            const mockContext = {
                locals: { user: mockClientUser }
            } as any;

            const result = validateAdminAccess(mockContext);
            expect(result.isAuthorized).toBe(false);
            expect(result.response?.status).toBe(403);
        });
    });

    describe('canAccessResource', () => {
        it('should allow admin access to any resource', () => {
            expect(canAccessResource(mockAdminUser, 'any-id', 'delete')).toBe(true);
        });

        it('should allow client access to own resources for read', () => {
            expect(canAccessResource(mockClientUser, 'client-123', 'read')).toBe(true);
        });

        it('should allow client access to own resources for write', () => {
            expect(canAccessResource(mockClientUser, 'client-123', 'write')).toBe(true);
        });

        it('should deny client access to others resources', () => {
            expect(canAccessResource(mockClientUser, 'other-id', 'read')).toBe(false);
        });
    });
});