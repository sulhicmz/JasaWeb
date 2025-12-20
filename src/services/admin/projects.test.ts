/**
 * Admin Project Service Tests
 * Comprehensive test coverage for project management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProjectService } from './projects';
import type { CreateProjectData, UpdateProjectData } from './projects';

// Mock Prisma Client with any types for simplified testing
const mockPrisma = {
    project: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn()
    },
    user: {
        findUnique: vi.fn()
    }
} as any;

describe('ProjectService', () => {
    let projectService: ReturnType<typeof createProjectService>;

    beforeEach(() => {
        vi.clearAllMocks();
        projectService = createProjectService(mockPrisma);
    });

    describe('getProjects', () => {
        it('should return paginated projects with user details', async () => {
            const mockProjects: any = [
                {
                    id: '1',
                    name: 'Web Sekolah',
                    type: 'sekolah',
                    status: 'in_progress',
                    url: 'https://example.com',
                    credentials: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 'user1',
                        name: 'John Doe',
                        email: 'john@example.com',
                        phone: '08123456789'
                    }
                }
            ];

            vi.mocked(mockPrisma.project.findMany).mockResolvedValue(mockProjects);
            vi.mocked(mockPrisma.project.count).mockResolvedValue(1);

            const result = await projectService.getProjects({ page: 1, limit: 10 });

            expect(result.projects).toHaveLength(1);
            expect(result.projects[0].name).toBe('Web Sekolah');
            expect(result.projects[0].user.name).toBe('John Doe');
            expect(result.pagination.total).toBe(1);
            expect(result.pagination.page).toBe(1);
        });

        it('should filter projects by status', async () => {
            vi.mocked(mockPrisma.project.findMany).mockResolvedValue([]);
            vi.mocked(mockPrisma.project.count).mockResolvedValue(0);

            await projectService.getProjects({ status: 'completed' });

            expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'completed'
                    })
                })
            );
        });

        it('should search projects by name, user name, and email', async () => {
            vi.mocked(mockPrisma.project.findMany).mockResolvedValue([]);
            vi.mocked(mockPrisma.project.count).mockResolvedValue(0);

            await projectService.getProjects({ search: 'john' });

            expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: [
                            { name: { contains: 'john', mode: 'insensitive' } },
                            { user: { name: { contains: 'john', mode: 'insensitive' } } },
                            { user: { email: { contains: 'john', mode: 'insensitive' } } }
                        ]
                    })
                })
            );
        });
    });

    describe('createProject', () => {
        const validProjectData: CreateProjectData = {
            name: 'Test Project',
            type: 'sekolah',
            userId: 'user1',
            status: 'pending_payment',
            url: 'https://example.com',
            credentials: { admin_url: 'https://admin.example.com' }
        };

        it('should create a new project successfully', async () => {
            const mockUser = { id: 'user1', name: 'John Doe' };
            const mockProject = { id: '1', ...validProjectData };

            vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(mockPrisma.project.create).mockResolvedValue(mockProject);

            const result = await projectService.createProject(validProjectData);

            expect(result).toEqual(mockProject);
            expect(mockPrisma.project.create).toHaveBeenCalledWith({
                data: validProjectData,
                select: expect.any(Object)
            });
        });

        it('should throw error if user does not exist', async () => {
            vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(null);

            await expect(projectService.createProject(validProjectData))
                .rejects.toThrow('User tidak ditemukan');
        });

        it('should throw error for invalid project type', async () => {
            const invalidData = { ...validProjectData, type: 'invalid' as any };
            const mockUser = { id: 'user1', name: 'John Doe' };
            
            vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);

            await expect(projectService.createProject(invalidData))
                .rejects.toThrow('Tipe project harus "sekolah", "berita", atau "company"');
        });

        it('should throw error for invalid status', async () => {
            const invalidData = { ...validProjectData, status: 'invalid' as any };
            const mockUser = { id: 'user1', name: 'John Doe' };
            
            vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);

            await expect(projectService.createProject(invalidData))
                .rejects.toThrow('Status project tidak valid');
        });

        it('should use default status if not provided', async () => {
            const dataWithoutStatus = { ...validProjectData };
            delete (dataWithoutStatus as any).status;
            
            const mockUser = { id: 'user1', name: 'John Doe' };
            const mockProject = { id: '1', ...dataWithoutStatus, status: 'pending_payment' };

            vi.mocked(mockPrisma.user.findUnique).mockResolvedValue(mockUser);
            vi.mocked(mockPrisma.project.create).mockResolvedValue(mockProject);

            await projectService.createProject(dataWithoutStatus);

            expect(mockPrisma.project.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    status: 'pending_payment'
                }),
                select: expect.any(Object)
            });
        });
    });

    describe('updateProject', () => {
        const existingProject = {
            id: '1',
            name: 'Old Project',
            type: 'sekolah',
            status: 'pending_payment',
            url: null,
            credentials: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
                id: 'user1',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '08123456789'
            }
        };

        beforeEach(() => {
            vi.mocked(mockPrisma.project.findUnique).mockResolvedValue(existingProject);
            vi.mocked(mockPrisma.project.update).mockResolvedValue(existingProject);
        });

        it('should update project successfully', async () => {
            const updateData: UpdateProjectData = {
                name: 'Updated Project',
                status: 'completed'
            };

            const result = await projectService.updateProject('1', updateData);

            expect(result).toEqual(existingProject);
            expect(mockPrisma.project.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: updateData,
                select: expect.any(Object)
            });
        });

        it('should throw error if project does not exist', async () => {
            vi.mocked(mockPrisma.project.findUnique).mockResolvedValue(null);

            await expect(projectService.updateProject('1', {}))
                .rejects.toThrow('Project tidak ditemukan');
        });

        it('should validate project type on update', async () => {
            const invalidData = { type: 'invalid' as any };

            await expect(projectService.updateProject('1', invalidData))
                .rejects.toThrow('Tipe project harus "sekolah", "berita", atau "company"');
        });

        it('should validate status on update', async () => {
            const invalidData = { status: 'invalid' as any };

            await expect(projectService.updateProject('1', invalidData))
                .rejects.toThrow('Status project tidak valid');
        });
    });

    describe('getProjectStats', () => {
        it('should return comprehensive project statistics', async () => {
            const mockCount = 50;
            const mockStatusStats = [
                { status: 'pending_payment', _count: 10 },
                { status: 'in_progress', _count: 20 },
                { status: 'completed', _count: 20 }
            ];
            const mockTypeStats = [
                { type: 'sekolah', _count: 25 },
                { type: 'berita', _count: 15 },
                { type: 'company', _count: 10 }
            ];
            const mockRecentProjects = [
                {
                    id: '1',
                    name: 'Recent Project',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: { id: 'user1', name: 'John Doe', email: 'john@example.com', phone: '08123456789' }
                }
            ];

            vi.mocked(mockPrisma.project.count).mockResolvedValue(mockCount);
            vi.mocked(mockPrisma.project.groupBy).mockResolvedValueOnce(mockStatusStats);
            vi.mocked(mockPrisma.project.groupBy).mockResolvedValueOnce(mockTypeStats);
            vi.mocked(mockPrisma.project.findMany).mockResolvedValue(mockRecentProjects);

            const result = await projectService.getProjectStats();

            expect(result.total).toBe(50);
            expect(result.byStatus).toEqual({
                'pending_payment': 10,
                'in_progress': 20,
                'completed': 20
            });
            expect(result.byType).toEqual({
                'sekolah': 25,
                'berita': 15,
                'company': 10
            });
            expect(result.recentlyUpdated).toHaveLength(1);
        });
    });
});