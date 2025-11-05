import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prismaService: MultiTenantPrismaService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    milestone: {
      count: jest.fn(),
    },
    approval: {
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
  };

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    status: 'active',
    startAt: new Date('2025-01-01'),
    dueAt: new Date('2025-12-31'),
    organizationId: 'org-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    prismaService = module.get<MultiTenantPrismaService>(MultiTenantPrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project with default status', async () => {
      const createDto = {
        name: 'New Project',
        startAt: new Date('2025-01-01'),
        dueAt: new Date('2025-12-31'),
      };
      const organizationId = 'org-1';

      mockPrismaService.project.create.mockResolvedValue({
        ...mockProject,
        ...createDto,
        status: 'draft',
      });

      const result = await service.create(createDto, organizationId);

      expect(mockPrismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          organizationId,
          status: 'draft',
        },
      });
      expect(result.status).toBe('draft');
    });

    it('should create a project with custom status', async () => {
      const createDto = {
        name: 'New Project',
        status: 'active',
        startAt: new Date('2025-01-01'),
        dueAt: new Date('2025-12-31'),
      };
      const organizationId = 'org-1';

      mockPrismaService.project.create.mockResolvedValue({
        ...mockProject,
        ...createDto,
      });

      const result = await service.create(createDto, organizationId);

      expect(mockPrismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          organizationId,
        },
      });
      expect(result.status).toBe('active');
    });
  });

  describe('findAll', () => {
    it('should return projects in summary view by default', async () => {
      const mockProjects = [mockProject];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.findAll();

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          name: true,
          status: true,
        }),
      });
      expect(result).toEqual(mockProjects);
    });

    it('should return projects in detail view when specified', async () => {
      const mockProjects = [mockProject];
      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

      const result = await service.findAll('detail');

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          milestones: true,
          files: true,
          approvals: true,
        }),
      });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findOne('project-1');

      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Project with ID non-existent not found',
      );
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto = { name: 'Updated Project', status: 'completed' };
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.project.update.mockResolvedValue({
        ...mockProject,
        ...updateDto,
      });

      const result = await service.update('project-1', updateDto);

      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: updateDto,
      });
      expect(result.name).toBe('Updated Project');
      expect(result.status).toBe('completed');
    });

    it('should throw NotFoundException when updating non-existent project', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.project.delete.mockResolvedValue(mockProject);

      const result = await service.remove('project-1');

      expect(mockPrismaService.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException when deleting non-existent project', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const mockProjectWithCounts = {
        id: 'project-1',
        _count: {
          milestones: 10,
          files: 5,
          tasks: 20,
        },
      };

      mockPrismaService.project.findUnique.mockResolvedValue(mockProjectWithCounts);
      mockPrismaService.milestone.count.mockResolvedValue(7);
      mockPrismaService.approval.count.mockResolvedValue(3);
      mockPrismaService.task.count.mockResolvedValue(15);

      const result = await service.getProjectStats('project-1');

      expect(result).toEqual({
        milestoneCount: 10,
        completedMilestones: 7,
        fileCount: 5,
        pendingApprovals: 3,
        taskCount: 20,
        completedTasks: 15,
        progress: 70,
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectStats('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
