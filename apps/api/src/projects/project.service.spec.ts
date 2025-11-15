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

  const mockProject = {
    id: '1',
    name: 'Test Project',
    status: 'draft',
    startAt: new Date(),
    dueAt: new Date(),
    organizationId: 'org1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMultiTenantPrisma = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockMultiTenantPrisma,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createProjectDto: CreateProjectDto = {
      name: 'Test Project',
      status: 'draft',
      startAt: new Date(),
      dueAt: new Date(),
    };

    it('should create a project successfully', async () => {
      mockMultiTenantPrisma.project.create.mockResolvedValue(mockProject);

      const result = await service.create(createProjectDto, 'org1');

      expect(result).toEqual(mockProject);
      expect(mockMultiTenantPrisma.project.create).toHaveBeenCalledWith({
        data: {
          ...createProjectDto,
          organizationId: 'org1',
          status: 'draft',
        },
      });
    });

    it('should set default status to draft if not provided', async () => {
      const dtoWithoutStatus = { name: 'Test Project' };
      mockMultiTenantPrisma.project.create.mockResolvedValue(mockProject);

      await service.create(dtoWithoutStatus, 'org1');

      expect(mockMultiTenantPrisma.project.create).toHaveBeenCalledWith({
        data: {
          ...dtoWithoutStatus,
          organizationId: 'org1',
          status: 'draft',
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return projects in summary view by default', async () => {
      const projects = [mockProject];
      mockMultiTenantPrisma.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll();

      expect(result).toEqual(projects);
      expect(mockMultiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          name: true,
          status: true,
          _count: expect.any(Object),
        }),
      });
    });

    it('should return projects in detail view when specified', async () => {
      const projects = [mockProject];
      mockMultiTenantPrisma.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll('detail');

      expect(result).toEqual(projects);
      expect(mockMultiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          milestones: true,
          files: true,
          approvals: true,
        }),
      });
    });
  });

  describe('findOne', () => {
    it('should return a project if found', async () => {
      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProject);
      expect(mockMultiTenantPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.objectContaining({
          milestones: true,
          files: true,
          approvals: true,
        }),
      });
    });

    it('should throw NotFoundException if project not found', async () => {
      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateProjectDto: UpdateProjectDto = {
      name: 'Updated Project',
      status: 'in_progress',
    };

    it('should update a project successfully', async () => {
      const updatedProject = { ...mockProject, ...updateProjectDto };
      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockMultiTenantPrisma.project.update.mockResolvedValue(updatedProject);

      const result = await service.update('1', updateProjectDto);

      expect(result).toEqual(updatedProject);
      expect(mockMultiTenantPrisma.project.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateProjectDto,
      });
    });

    it('should throw NotFoundException if project to update not found', async () => {
      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.update('1', updateProjectDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should delete a project successfully', async () => {
      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockMultiTenantPrisma.project.delete.mockResolvedValue(mockProject);

      const result = await service.remove('1');

      expect(result).toEqual(mockProject);
      expect(mockMultiTenantPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if project to delete not found', async () => {
      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrganization', () => {
    it('should return projects for specific organization', async () => {
      const projects = [mockProject];
      mockMultiTenantPrisma.project.findMany.mockResolvedValue(projects);

      const result = await service.findByOrganization('org1');

      expect(result).toEqual(projects);
      expect(mockMultiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        select: expect.any(Object),
      });
    });
  });

  describe('findByStatus', () => {
    it('should return projects with specific status', async () => {
      const projects = [mockProject];
      mockMultiTenantPrisma.project.findMany.mockResolvedValue(projects);

      const result = await service.findByStatus('draft');

      expect(result).toEqual(projects);
      expect(mockMultiTenantPrisma.project.findMany).toHaveBeenCalledWith({
        where: { status: 'draft' },
        select: expect.any(Object),
      });
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const projectWithCount = {
        ...mockProject,
        _count: {
          milestones: 5,
          files: 10,
          tasks: 15,
        },
      };

      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(
        projectWithCount
      );
      mockMultiTenantPrisma.milestone.count.mockResolvedValue(3);
      mockMultiTenantPrisma.approval.count.mockResolvedValue(2);
      mockMultiTenantPrisma.task.count.mockResolvedValue(8);

      const result = await service.getProjectStats('1');

      expect(result).toEqual({
        milestoneCount: 5,
        completedMilestones: 3,
        fileCount: 10,
        pendingApprovals: 2,
        taskCount: 15,
        completedTasks: 8,
        progress: 60,
      });
    });

    it('should throw NotFoundException if project not found', async () => {
      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectStats('1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle zero milestones correctly', async () => {
      const projectWithZeroMilestones = {
        ...mockProject,
        _count: {
          milestones: 0,
          files: 5,
          tasks: 10,
        },
      };

      mockMultiTenantPrisma.project.findUnique.mockResolvedValue(
        projectWithZeroMilestones
      );
      mockMultiTenantPrisma.milestone.count.mockResolvedValue(0);
      mockMultiTenantPrisma.approval.count.mockResolvedValue(1);
      mockMultiTenantPrisma.task.count.mockResolvedValue(5);

      const result = await service.getProjectStats('1');

      expect(result.progress).toBe(0);
    });
  });
});
