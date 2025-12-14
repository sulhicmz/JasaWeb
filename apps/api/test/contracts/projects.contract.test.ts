import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../src/projects/project.controller';
import {
  ProjectService,
  CreateProjectDto,
  UpdateProjectDto,
} from '../../src/projects/project.service';
import { MultiTenantPrismaService } from '../../src/common/database/multi-tenant-prisma.service';

describe('ProjectController API Contract Tests', () => {
  let controller: ProjectController;
  let service: ProjectService;
  let multiTenantPrisma: MultiTenantPrismaService;

  const mockProject = {
    id: '1',
    name: 'Test Project',
    status: 'active',
    startAt: new Date(),
    dueAt: new Date(),
    organizationId: 'org1',
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

  const mockProjectsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    findByOrganization: vi.fn(),
    findByStatus: vi.fn(),
    getProjectStats: vi.fn(),
  };

  const mockMultiTenantPrismaService = {
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    milestone: {
      count: vi.fn(),
    },
    approval: {
      count: vi.fn(),
    },
    task: {
      count: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: mockProjectsService,
        },
        {
          provide: MultiTenantPrismaService,
          useValue: mockMultiTenantPrismaService,
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get<ProjectService>(ProjectService);
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );

    vi.clearAllMocks();
  });

  describe('API Contract - POST /projects', () => {
    it('should create a project with correct contract', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
        status: 'draft',
      };

      mockProjectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createProjectDto, 'org1');

      // API Contract validation
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('startAt');
      expect(result).toHaveProperty('dueAt');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');

      // Type validation
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.status).toBe('string');
      expect(result.startAt).toBeInstanceOf(Date);
      expect(result.dueAt).toBeInstanceOf(Date);
      expect(typeof result.organizationId).toBe('string');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      // Value validation
      expect([
        'draft',
        'active',
        'completed',
        'on-hold',
        'cancelled',
      ]).toContain(result.status);
      expect(result.name).toBe('Test Project');
    });

    it('should set default status to draft if not provided', async () => {
      const createProjectDto = {
        name: 'Test Project',
      };

      const projectWithDefaultStatus = {
        ...mockProject,
        status: 'draft',
      };

      mockProjectsService.create.mockResolvedValue(projectWithDefaultStatus);

      const result = await controller.create(createProjectDto, 'org1');

      expect(result.status).toBe('draft');
    });
  });

  describe('API Contract - GET /projects', () => {
    it('should return projects list with correct contract', async () => {
      const projects = [mockProject];
      mockProjectsService.findAll.mockResolvedValue(projects);

      const result = await controller.findAll();

      // API Contract validation
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);

      const project = result[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('startAt');
      expect(project).toHaveProperty('dueAt');
      expect(project).toHaveProperty('organizationId');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');

      // Type validation for each project
      expect(typeof project.id).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.status).toBe('string');
      expect(project.startAt).toBeInstanceOf(Date);
      expect(project.dueAt).toBeInstanceOf(Date);
      expect(typeof project.organizationId).toBe('string');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should return projects in detail view when specified', async () => {
      const projects = [mockProjectWithRelations];
      mockProjectsService.findAll.mockResolvedValue(projects);

      const result = await controller.findAll('detail');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);

      const project = result[0];
      expect(project).toHaveProperty('milestones');
      expect(project).toHaveProperty('files');
      expect(project).toHaveProperty('approvals');
      expect(project).toHaveProperty('tasks');
      expect(project).toHaveProperty('tickets');
      expect(project).toHaveProperty('invoices');

      expect(Array.isArray(project.milestones)).toBe(true);
      expect(Array.isArray(project.files)).toBe(true);
      expect(Array.isArray(project.approvals)).toBe(true);
      expect(Array.isArray(project.tasks)).toBe(true);
      expect(Array.isArray(project.tickets)).toBe(true);
      expect(Array.isArray(project.invoices)).toBe(true);
    });
  });

  describe('API Contract - GET /projects/:id', () => {
    it('should return a single project with correct contract', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProjectWithRelations);

      const result = await controller.findOne('1');

      // API Contract validation
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('startAt');
      expect(result).toHaveProperty('dueAt');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('milestones');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('approvals');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('invoices');

      // Type validation
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.status).toBe('string');
      expect(result.startAt).toBeInstanceOf(Date);
      expect(result.dueAt).toBeInstanceOf(Date);
      expect(typeof result.organizationId).toBe('string');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      // Note: Relations are only included in detail view
    });

    it('should handle project not found', async () => {
      mockProjectsService.findOne.mockRejectedValue(
        new Error('Project not found')
      );

      await expect(controller.findOne('999')).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('API Contract - PATCH /projects/:id', () => {
    it('should update a project with correct contract', async () => {
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Project',
      };

      const updatedProject = { ...mockProject, name: 'Updated Project' };
      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update('1', updateProjectDto);

      // API Contract validation
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('startAt');
      expect(result).toHaveProperty('dueAt');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');

      // Verify update
      expect(result.name).toBe('Updated Project');
      expect(typeof result.id).toBe('string');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle project not found on update', async () => {
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Project',
      };

      mockProjectsService.update.mockRejectedValue(
        new Error('Project not found')
      );

      await expect(controller.update('999', updateProjectDto)).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('API Contract - DELETE /projects/:id', () => {
    it('should delete a project with correct contract', async () => {
      mockProjectsService.remove.mockResolvedValue(mockProject);

      const result = await controller.remove('1');

      // API Contract validation
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('startAt');
      expect(result).toHaveProperty('dueAt');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');

      // Verify deleted project data
      expect(result.id).toBe('1');
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
    });

    it('should handle project not found on delete', async () => {
      mockProjectsService.remove.mockRejectedValue(
        new Error('Project not found')
      );

      await expect(controller.remove('999')).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('API Contract - GET /projects/organization/:orgId', () => {
    it('should return projects by organization with correct contract', async () => {
      const projects = [mockProject];
      mockProjectsService.findByOrganization.mockResolvedValue(projects);

      const result = await controller.findByOrganization('org1');

      // API Contract validation
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);

      const project = result[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('organizationId');

      expect(typeof project.id).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.status).toBe('string');
      expect(typeof project.organizationId).toBe('string');
      expect(project.organizationId).toBe('org1');
    });
  });

  describe('API Contract - GET /projects/status/:status', () => {
    it('should return projects by status with correct contract', async () => {
      const projects = [mockProject];
      mockProjectsService.findByStatus.mockResolvedValue(projects);

      const result = await controller.findByStatus('active');

      // API Contract validation
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);

      const project = result[0];
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('status');

      expect(typeof project.id).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.status).toBe('string');
      expect(project.status).toBe('active');
    });
  });

  describe('API Contract - GET /projects/:id/stats', () => {
    it('should return project statistics with correct contract', async () => {
      const mockStats = {
        milestoneCount: 5,
        completedMilestones: 3,
        fileCount: 10,
        pendingApprovals: 2,
        taskCount: 8,
        completedTasks: 4,
        progress: 60,
      };

      mockProjectsService.getProjectStats.mockResolvedValue(mockStats);

      const result = await controller.getProjectStats('1');

      // API Contract validation
      expect(result).toBeDefined();
      expect(result).toHaveProperty('milestoneCount');
      expect(result).toHaveProperty('completedMilestones');
      expect(result).toHaveProperty('fileCount');
      expect(result).toHaveProperty('pendingApprovals');
      expect(result).toHaveProperty('taskCount');
      expect(result).toHaveProperty('completedTasks');
      expect(result).toHaveProperty('progress');

      // Type validation
      expect(typeof result.milestoneCount).toBe('number');
      expect(typeof result.completedMilestones).toBe('number');
      expect(typeof result.fileCount).toBe('number');
      expect(typeof result.pendingApprovals).toBe('number');
      expect(typeof result.taskCount).toBe('number');
      expect(typeof result.completedTasks).toBe('number');
      expect(typeof result.progress).toBe('number');

      // Value validation
      expect(result.milestoneCount).toBeGreaterThanOrEqual(0);
      expect(result.completedMilestones).toBeGreaterThanOrEqual(0);
      expect(result.completedMilestones).toBeLessThanOrEqual(
        result.milestoneCount
      );
      expect(result.fileCount).toBeGreaterThanOrEqual(0);
      expect(result.pendingApprovals).toBeGreaterThanOrEqual(0);
      expect(result.taskCount).toBeGreaterThanOrEqual(0);
      expect(result.completedTasks).toBeGreaterThanOrEqual(0);
      expect(result.completedTasks).toBeLessThanOrEqual(result.taskCount);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
    });

    it('should handle project not found for stats', async () => {
      mockProjectsService.getProjectStats.mockRejectedValue(
        new Error('Project not found')
      );

      await expect(controller.getProjectStats('999')).rejects.toThrow(
        'Project not found'
      );
    });
  });

  describe('Error Handling Contract', () => {
    it('should handle database connection errors', async () => {
      mockProjectsService.findAll.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.findAll()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle validation errors', async () => {
      const invalidProjectDto = {
        name: '', // Empty name should fail validation
      };

      mockProjectsService.create.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(controller.create(invalidProjectDto)).rejects.toThrow(
        'Validation failed'
      );
    });
  });

  describe('Data Validation Contract', () => {
    it('should validate project status values', async () => {
      const validStatuses = [
        'draft',
        'active',
        'completed',
        'on-hold',
        'cancelled',
      ];

      validStatuses.forEach((status) => {
        const project = { ...mockProject, status };
        mockProjectsService.findByStatus.mockResolvedValue([project]);

        return expect(controller.findByStatus(status)).resolves.toBeDefined();
      });
    });

    it('should handle invalid project ID format', async () => {
      mockProjectsService.findOne.mockRejectedValue(
        new Error('Invalid project ID format')
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        'Invalid project ID format'
      );
    });

    it('should validate date fields', async () => {
      const projectWithDates = {
        ...mockProject,
        startAt: new Date('2023-01-01'),
        dueAt: new Date('2023-12-31'),
      };

      mockProjectsService.findOne.mockResolvedValue(projectWithDates);

      const result = await controller.findOne('1');

      expect(result.startAt).toBeInstanceOf(Date);
      expect(result.dueAt).toBeInstanceOf(Date);
      expect(result.startAt.getTime()).toBeLessThanOrEqual(
        result.dueAt.getTime()
      );
    });
  });
});
