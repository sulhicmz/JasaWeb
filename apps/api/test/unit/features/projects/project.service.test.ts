import {
  ProjectService,
  CreateProjectDto,
  UpdateProjectDto,
} from './project.service';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createMockMultiTenantPrismaService,
  TestUtils,
  resetAllMocks,
} from '@jasaweb/testing';

describe('ProjectService', () => {
  let service: ProjectService;
<<<<<<<< HEAD:apps/api/src/projects/project.service.test.ts
========
  let mockMultiTenantPrismaService: ReturnType<
    typeof createMockMultiTenantPrismaService
  >;
>>>>>>>> origin/dev:apps/api/test/unit/features/projects/project.service.test.ts

  const mockProject = TestUtils.createTestProject({
    id: '1',
    name: 'Test Project',
    status: 'active',
    startAt: new Date(),
    dueAt: new Date(),
  });

  const mockProjectWithRelations = {
    ...mockProject,
    milestones: [],
    files: [],
    approvals: [],
    tasks: [],
    tickets: [],
    invoices: [],
  };

  beforeEach(() => {
    mockMultiTenantPrismaService = createMockMultiTenantPrismaService();

<<<<<<<< HEAD:apps/api/src/projects/project.service.test.ts
  beforeEach(async () => {
    const mockRequest = {
      organizationId: 'org1',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockMultiTenantPrismaService,
        },
        {
          provide: 'REQUEST',
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
========
    // Create service instance manually
    service = new ProjectService(mockMultiTenantPrismaService);
>>>>>>>> origin/dev:apps/api/test/unit/features/projects/project.service.test.ts
  });

  afterEach(() => {
    resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProjectDto: CreateProjectDto = {
      name: 'Test Project',
      status: 'draft',
    };

    it('should create a new project', async () => {
      mockMultiTenantPrismaService.project.create.mockResolvedValue(
        mockProject
      );

      const result = await service.create(createProjectDto, 'org1');

      expect(mockMultiTenantPrismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createProjectDto,
          organizationId: 'org1',
          status: 'draft',
        },
      });
      expect(result).toEqual(mockProject);
    });

    it('should set default status to draft if not provided', async () => {
      const createProjectWithoutStatus = {
        name: 'Test Project',
      };

      mockMultiTenantPrismaService.project.create.mockResolvedValue(
        mockProject
      );

      await service.create(createProjectWithoutStatus, 'org1');

      expect(mockMultiTenantPrismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createProjectWithoutStatus,
          organizationId: 'org1',
          status: 'draft',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return projects in summary view by default', async () => {
      const projects = [mockProject];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll('summary', 'org1');

      expect(result).toEqual(projects);
      expect(
        mockMultiTenantPrismaService.project.findMany
      ).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        select: expect.objectContaining({
          id: true,
          name: true,
          status: true,
          _count: expect.any(Object),
        }),
      });
    });

    it('should return projects in detail view when specified', async () => {
      const projects = [mockProjectWithRelations];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll('detail');

      expect(result).toEqual(projects);
      expect(
        mockMultiTenantPrismaService.project.findMany
      ).toHaveBeenCalledWith({
        include: expect.objectContaining({
          milestones: true,
          files: true,
          approvals: true,
        }),
      });
    });

    it('should filter by organizationId if provided', async () => {
      const projects = [mockProject];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      await service.findAll('summary', 'org1');

      expect(
        mockMultiTenantPrismaService.project.findMany
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org1' },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProjectWithRelations
      );

      const result = await service.findOne('1');

      expect(result).toEqual(mockProjectWithRelations);
      expect(
        mockMultiTenantPrismaService.project.findUnique
      ).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          milestones: true,
          files: true,
          approvals: true,
        }),
      });
    });

    it('should throw NotFoundException if project not found', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if organizationId does not match', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProjectWithRelations
      );

      await expect(service.findOne('1', 'other-org')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateProjectDto: UpdateProjectDto = {
      name: 'Updated Project',
    };

    it('should update a project', async () => {
      const updatedProject = { ...mockProject, name: 'Updated Project' };
      // findUnique is called first in update
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.project.update.mockResolvedValue(
        updatedProject
      );

      const result = await service.update('1', updateProjectDto);

      expect(mockMultiTenantPrismaService.project.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateProjectDto,
      });
      expect(result).toEqual(updatedProject);
    });

    it('should throw NotFoundException if project to update not found', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.update('999', updateProjectDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      // findUnique is called first in remove
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.project.delete.mockResolvedValue(
        mockProject
      );

      const result = await service.remove('1');

      expect(result).toEqual(mockProject);
      expect(mockMultiTenantPrismaService.project.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if project to delete not found', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrganization', () => {
    it('should return projects by organization', async () => {
      const projects = [mockProject];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findByOrganization('org1');

      expect(result).toEqual(projects);
      expect(
        mockMultiTenantPrismaService.project.findMany
      ).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        select: expect.any(Object),
      });
    });
  });

  describe('findByStatus', () => {
    it('should return projects by status', async () => {
      const projects = [mockProject];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findByStatus('active');

      expect(result).toEqual(projects);
      expect(
        mockMultiTenantPrismaService.project.findMany
      ).toHaveBeenCalledWith({
        where: { status: 'active' },
        select: expect.any(Object),
      });
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const projectWithCount = {
        id: '1',
        organizationId: 'org1',
        _count: {
          milestones: 5,
          files: 10,
          tasks: 8,
        },
      };

      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        projectWithCount
      );
      mockMultiTenantPrismaService.milestone.count.mockResolvedValue(3);
      mockMultiTenantPrismaService.approval.count.mockResolvedValue(2);
      mockMultiTenantPrismaService.task.count.mockResolvedValue(4);

      const result = await service.getProjectStats('1');

      expect(result).toEqual({
        milestoneCount: 5,
        completedMilestones: 3,
        fileCount: 10,
        pendingApprovals: 2,
        taskCount: 8,
        completedTasks: 4,
        progress: 60,
      });
    });

    it('should throw NotFoundException if project not found', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectStats('999')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle zero milestones for progress calculation', async () => {
      const projectWithZeroMilestones = {
        id: '1',
        organizationId: 'org1',
        _count: {
          milestones: 0,
          files: 5,
          tasks: 3,
        },
      };

      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        projectWithZeroMilestones
      );
      mockMultiTenantPrismaService.milestone.count.mockResolvedValue(0);
      mockMultiTenantPrismaService.approval.count.mockResolvedValue(1);
      mockMultiTenantPrismaService.task.count.mockResolvedValue(2);

      const result = await service.getProjectStats('1');

      expect(result.progress).toBe(0);
    });
  });
});
