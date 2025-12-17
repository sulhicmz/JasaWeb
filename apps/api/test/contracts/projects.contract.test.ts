import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../src/projects/project.controller';
import {
  ProjectService,
  UpdateProjectDto,
} from '../../src/projects/project.service';
import { MultiTenantPrismaService } from '../../src/common/database/multi-tenant-prisma.service';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

describe('ProjectController API Contract Tests', () => {
  let controller: ProjectController;
  let service: ProjectService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get<ProjectService>(ProjectService);
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('API Contract - GET /projects', () => {
    it('should return projects list with correct contract', async () => {
      const projects = [mockProject];
      mockProjectsService.findAll.mockResolvedValue(projects);

      const result = await controller.findAll('org1');

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
      if (project) {
        expect(typeof project.id).toBe('string');
        expect(typeof project.name).toBe('string');
        expect(typeof project.status).toBe('string');
        expect(project.startAt).toBeInstanceOf(Date);
        expect(project.dueAt).toBeInstanceOf(Date);
        expect(typeof project.organizationId).toBe('string');
        expect(project.createdAt).toBeInstanceOf(Date);
        expect(project.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should return projects in detail view when specified', async () => {
      const detailProjects = [mockProjectWithRelations];
      mockProjectsService.findAll.mockResolvedValue(detailProjects);

      const result = await controller.findAll('org1', 'detail');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);

      const project = result[0] as any;
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

      const result = await controller.findOne('1', 'org1');

      // API Contract validation
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('startAt');
      expect(result).toHaveProperty('dueAt');
      expect(result).toHaveProperty('organizationId');

      // Type validation
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.status).toBe('string');
      expect(result.startAt).toBeInstanceOf(Date);
      expect(result.dueAt).toBeInstanceOf(Date);
      expect(typeof result.organizationId).toBe('string');
    });

    it('should return null if project not found', async () => {
      mockProjectsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('999', 'org1')).resolves.toBeNull();
    });
  });

  describe('API Contract - PATCH /projects/:id', () => {
    it('should update a project with correct contract', async () => {
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Project',
        status: 'completed',
      };

      const updatedProject = {
        ...mockProject,
        ...updateProjectDto,
      };

      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update('1', updateProjectDto, 'org1');

      // API Contract validation
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
      expect(result.name).toBe('Updated Project');
      expect(result.status).toBe('completed');
    });
  });

  describe('API Contract - DELETE /projects/:id', () => {
    it('should delete a project with correct contract', async () => {
      mockProjectsService.remove.mockResolvedValue(mockProject);

      const result = await controller.remove('1', 'org1');

      // API Contract validation - should return the deleted project
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result.id).toBe('1');
    });
  });

  describe('API Contract - GET /projects/:id/stats', () => {
    it('should return project statistics with correct contract', async () => {
      const mockStats = {
        milestoneCount: 5,
        completedMilestones: 3,
        fileCount: 8,
        pendingApprovals: 2,
        taskCount: 15,
        completedTasks: 12,
        progress: 60,
      };

      mockProjectsService.getProjectStats.mockResolvedValue(mockStats);

      const result = await controller.getProjectStats('1', 'org1');

      // API Contract validation
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
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(100);
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

      for (const status of validStatuses) {
        const projectWithStatus = { ...mockProject, status };
        mockProjectsService.findAll.mockResolvedValue([projectWithStatus]);

        const result = await controller.findAll('org1');
        expect(result[0].status).toBe(status);
        expect(validStatuses).toContain(status);
      }
    });

    it('should validate date fields format', async () => {
      mockProjectsService.findAll.mockResolvedValue([mockProject]);

      const result = await controller.findAll('org1');
      const project = result[0];

      expect(project.startAt).toBeInstanceOf(Date);
      expect(project.dueAt).toBeInstanceOf(Date);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate string fields are not empty', async () => {
      mockProjectsService.findAll.mockResolvedValue([mockProject]);

      const result = await controller.findAll('org1');
      const project = result[0];

      expect(typeof project.id).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.status).toBe('string');
      expect(typeof project.organizationId).toBe('string');

      expect(project.id.length).toBeGreaterThan(0);
      expect(project.name.length).toBeGreaterThan(0);
      expect(project.status.length).toBeGreaterThan(0);
      expect(project.organizationId.length).toBeGreaterThan(0);
    });
  });
});
