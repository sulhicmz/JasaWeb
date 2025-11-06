import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prismaService: jest.Mocked<MultiTenantPrismaService>;

  const mockOrganizationId = 'org-123';
  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    status: 'active',
    startAt: new Date('2024-01-01'),
    dueAt: new Date('2024-12-31'),
    organizationId: mockOrganizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProjectWithRelations = {
    ...mockProject,
    milestones: [],
    files: [],
    approvals: [],
    tasks: [],
    tickets: [],
    invoices: [],
  };

  beforeEach(async () => {
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
    prismaService = module.get(MultiTenantPrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project with default status', async () => {
      const createDto = {
        name: 'New Project',
        startAt: new Date('2024-01-01'),
        dueAt: new Date('2024-12-31'),
      };

      prismaService.project.create.mockResolvedValue(mockProject);

      const result = await service.create(createDto, mockOrganizationId);

      expect(prismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          organizationId: mockOrganizationId,
          status: 'draft',
        },
      });
      expect(result).toEqual(mockProject);
    });

    it('should create a project with custom status', async () => {
      const createDto = {
        name: 'New Project',
        status: 'active',
        startAt: new Date('2024-01-01'),
        dueAt: new Date('2024-12-31'),
      };

      prismaService.project.create.mockResolvedValue({ ...mockProject, status: 'active' });

      const result = await service.create(createDto, mockOrganizationId);

      expect(prismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          organizationId: mockOrganizationId,
          status: 'active',
        },
      });
      expect(result.status).toBe('active');
    });
  });

  describe('findAll', () => {
    it('should return projects in summary view by default', async () => {
      const mockSummaryProjects = [
        {
          id: mockProject.id,
          name: mockProject.name,
          status: mockProject.status,
          startAt: mockProject.startAt,
          dueAt: mockProject.dueAt,
          createdAt: mockProject.createdAt,
          updatedAt: mockProject.updatedAt,
          organizationId: mockProject.organizationId,
          _count: {
            milestones: 0,
            files: 0,
            approvals: 0,
            tasks: 0,
            tickets: 0,
            invoices: 0,
          },
        },
      ];

      prismaService.project.findMany.mockResolvedValue(mockSummaryProjects);

      const result = await service.findAll();

      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          name: true,
          status: true,
        }),
      });
      expect(result).toEqual(mockSummaryProjects);
    });

    it('should return projects in detail view when specified', async () => {
      prismaService.project.findMany.mockResolvedValue([mockProjectWithRelations]);

      const result = await service.findAll('detail');

      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          milestones: true,
          files: true,
          approvals: true,
        }),
      });
      expect(result).toEqual([mockProjectWithRelations]);
    });
  });

  describe('findOne', () => {
    it('should return a project when found', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProjectWithRelations);

      const result = await service.findOne(mockProject.id);

      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockProjectWithRelations);
    });

    it('should throw NotFoundException when project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update a project when it exists', async () => {
      const updateDto = {
        name: 'Updated Project',
        status: 'completed',
      };

      prismaService.project.findUnique.mockResolvedValue(mockProjectWithRelations);
      prismaService.project.update.mockResolvedValue({ ...mockProject, ...updateDto });

      const result = await service.update(mockProject.id, updateDto);

      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        include: expect.any(Object),
      });
      expect(prismaService.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: updateDto,
      });
      expect(result.name).toBe(updateDto.name);
      expect(result.status).toBe(updateDto.status);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.project.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a project when it exists', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProjectWithRelations);
      prismaService.project.delete.mockResolvedValue(mockProject);

      const result = await service.remove(mockProject.id);

      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        include: expect.any(Object),
      });
      expect(prismaService.project.delete).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(prismaService.project.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByOrganization', () => {
    it('should return projects for a specific organization', async () => {
      prismaService.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.findByOrganization(mockOrganizationId);

      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        select: expect.any(Object),
      });
      expect(result).toEqual([mockProject]);
    });

    it('should support detail view for organization projects', async () => {
      prismaService.project.findMany.mockResolvedValue([mockProjectWithRelations]);

      const result = await service.findByOrganization(mockOrganizationId, 'detail');

      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        include: expect.any(Object),
      });
      expect(result).toEqual([mockProjectWithRelations]);
    });
  });

  describe('findByStatus', () => {
    it('should return projects with specific status', async () => {
      const status = 'active';
      prismaService.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.findByStatus(status);

      expect(prismaService.project.findMany).toHaveBeenCalledWith({
        where: { status },
        select: expect.any(Object),
      });
      expect(result).toEqual([mockProject]);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const mockProjectStats = {
        id: mockProject.id,
        _count: {
          milestones: 10,
          files: 5,
          tasks: 20,
        },
      };

      prismaService.project.findUnique.mockResolvedValue(mockProjectStats);
      prismaService.milestone.count.mockResolvedValue(7);
      prismaService.approval.count.mockResolvedValue(2);
      prismaService.task.count.mockResolvedValue(15);

      const result = await service.getProjectStats(mockProject.id);

      expect(result).toEqual({
        milestoneCount: 10,
        completedMilestones: 7,
        fileCount: 5,
        pendingApprovals: 2,
        taskCount: 20,
        completedTasks: 15,
        progress: 70,
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectStats('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle zero milestones correctly', async () => {
      const mockProjectStats = {
        id: mockProject.id,
        _count: {
          milestones: 0,
          files: 0,
          tasks: 0,
        },
      };

      prismaService.project.findUnique.mockResolvedValue(mockProjectStats);
      prismaService.milestone.count.mockResolvedValue(0);
      prismaService.approval.count.mockResolvedValue(0);
      prismaService.task.count.mockResolvedValue(0);

      const result = await service.getProjectStats(mockProject.id);

      expect(result.progress).toBe(0);
    });
  });
});
