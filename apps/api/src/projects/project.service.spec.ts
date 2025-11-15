import { Test, TestingModule } from '@nestjs/testing';
import {
  ProjectService,
  CreateProjectDto,
  UpdateProjectDto,
} from './project.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectService', () => {
  let service: ProjectService;
  let multiTenantPrisma: MultiTenantPrismaService;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    status: 'active',
    startAt: new Date('2024-01-01'),
    dueAt: new Date('2024-12-31'),
    organizationId: 'org-1',
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

  const mockMultiTenantPrismaService = {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockMultiTenantPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProjectDto: CreateProjectDto = {
      name: 'New Project',
      status: 'draft',
      startAt: new Date('2024-01-01'),
      dueAt: new Date('2024-12-31'),
    };

    it('should create a new project with default status', async () => {
      const createDtoWithoutStatus = {
        name: 'New Project',
        startAt: new Date('2024-01-01'),
        dueAt: new Date('2024-12-31'),
      };

      mockMultiTenantPrismaService.project.create.mockResolvedValue(
        mockProject
      );

      const result = await service.create(createDtoWithoutStatus, 'org-1');

      expect(multiTenantPrisma.project.create).toHaveBeenCalledWith({
        data: {
          ...createDtoWithoutStatus,
          organizationId: 'org-1',
          status: 'draft',
        },
      });
      expect(result).toEqual(mockProject);
    });

    it('should create a new project with provided status', async () => {
      mockMultiTenantPrismaService.project.create.mockResolvedValue(
        mockProject
      );

      const result = await service.create(createProjectDto, 'org-1');

      expect(multiTenantPrisma.project.create).toHaveBeenCalledWith({
        data: {
          ...createProjectDto,
          organizationId: 'org-1',
          status: createProjectDto.status,
        },
      });
      expect(result).toEqual(mockProject);
    });
  });

  describe('findAll', () => {
    it('should return projects in summary view by default', async () => {
      const projects = [mockProject];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll();

      expect(multiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          name: true,
          status: true,
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(projects);
    });

    it('should return projects in detail view when specified', async () => {
      const projects = [mockProjectWithRelations];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll('detail');

      expect(multiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        include: {
          milestones: true,
          files: true,
          approvals: true,
          tasks: true,
          tickets: true,
          invoices: true,
        },
      });
      expect(result).toEqual(projects);
    });
  });

  describe('findOne', () => {
    it('should return a project with relations', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProjectWithRelations
      );

      const result = await service.findOne('project-1');

      expect(multiTenantPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: {
          milestones: true,
          files: true,
          approvals: true,
          tasks: true,
          tickets: true,
          invoices: true,
        },
      });
      expect(result).toEqual(mockProjectWithRelations);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const updateProjectDto: UpdateProjectDto = {
      name: 'Updated Project',
      status: 'completed',
    };

    it('should update a project', async () => {
      const updatedProject = { ...mockProject, ...updateProjectDto };
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.project.update.mockResolvedValue(
        updatedProject
      );

      const result = await service.update('project-1', updateProjectDto);

      expect(multiTenantPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: {
          milestones: true,
          files: true,
          approvals: true,
          tasks: true,
          tickets: true,
          invoices: true,
        },
      });
      expect(multiTenantPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        data: updateProjectDto,
      });
      expect(result).toEqual(updatedProject);
    });

    it('should throw NotFoundException if project to update does not exist', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', updateProjectDto)
      ).rejects.toThrow(NotFoundException);
      expect(multiTenantPrisma.project.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a project', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProject
      );
      mockMultiTenantPrismaService.project.delete.mockResolvedValue(
        mockProject
      );

      const result = await service.remove('project-1');

      expect(multiTenantPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: {
          milestones: true,
          files: true,
          approvals: true,
          tasks: true,
          tickets: true,
          invoices: true,
        },
      });
      expect(multiTenantPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project to delete does not exist', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
      expect(multiTenantPrisma.project.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByOrganization', () => {
    it('should return projects by organization in summary view by default', async () => {
      const projects = [mockProject];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findByOrganization('org-1');

      expect(multiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        select: expect.objectContaining({
          id: true,
          name: true,
          status: true,
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(projects);
    });

    it('should return projects by organization in detail view when specified', async () => {
      const projects = [mockProjectWithRelations];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findByOrganization('org-1', 'detail');

      expect(multiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: {
          milestones: true,
          files: true,
          approvals: true,
          tasks: true,
          tickets: true,
          invoices: true,
        },
      });
      expect(result).toEqual(projects);
    });
  });

  describe('findByStatus', () => {
    it('should return projects by status in summary view by default', async () => {
      const projects = [mockProject];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findByStatus('active');

      expect(multiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        select: expect.objectContaining({
          id: true,
          name: true,
          status: true,
          _count: expect.any(Object),
        }),
      });
      expect(result).toEqual(projects);
    });

    it('should return projects by status in detail view when specified', async () => {
      const projects = [mockProjectWithRelations];
      mockMultiTenantPrismaService.project.findMany.mockResolvedValue(projects);

      const result = await service.findByStatus('active', 'detail');

      expect(multiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        include: {
          milestones: true,
          files: true,
          approvals: true,
          tasks: true,
          tickets: true,
          invoices: true,
        },
      });
      expect(result).toEqual(projects);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const mockProjectWithCount = {
        id: 'project-1',
        _count: {
          milestones: 5,
          files: 10,
          tasks: 20,
        },
      };

      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProjectWithCount
      );
      mockMultiTenantPrismaService.milestone.count.mockResolvedValue(3);
      mockMultiTenantPrismaService.approval.count.mockResolvedValue(2);
      mockMultiTenantPrismaService.task.count.mockResolvedValue(15);

      const result = await service.getProjectStats('project-1');

      expect(multiTenantPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        select: {
          id: true,
          _count: {
            select: {
              milestones: true,
              files: true,
              tasks: true,
            },
          },
        },
      });
      expect(multiTenantPrisma.milestone.count).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          status: 'completed',
        },
      });
      expect(multiTenantPrisma.approval.count).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          status: 'pending',
        },
      });
      expect(multiTenantPrisma.task.count).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          status: 'completed',
        },
      });

      expect(result).toEqual({
        milestoneCount: 5,
        completedMilestones: 3,
        fileCount: 10,
        pendingApprovals: 2,
        taskCount: 20,
        completedTasks: 15,
        progress: 60, // Math.round((3/5) * 100)
      });
    });

    it('should throw NotFoundException if project for stats does not exist', async () => {
      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectStats('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle zero milestones correctly', async () => {
      const mockProjectWithZeroCount = {
        id: 'project-1',
        _count: {
          milestones: 0,
          files: 5,
          tasks: 10,
        },
      };

      mockMultiTenantPrismaService.project.findUnique.mockResolvedValue(
        mockProjectWithZeroCount
      );
      mockMultiTenantPrismaService.milestone.count.mockResolvedValue(0);
      mockMultiTenantPrismaService.approval.count.mockResolvedValue(1);
      mockMultiTenantPrismaService.task.count.mockResolvedValue(5);

      const result = await service.getProjectStats('project-1');

      expect(result.progress).toBe(0); // Should be 0 when no milestones
    });
  });
});
