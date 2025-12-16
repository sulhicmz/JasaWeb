import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from '../../src/projects/project.controller';
import { ProjectService } from '../../src/projects/project.service';
import { Reflector } from '@nestjs/core';

describe('ProjectController Fixed Tests', () => {
  let controller: ProjectController;
  let service: ProjectService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: mockProjectsService,
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn().mockReturnValue([]),
            get: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get<ProjectService>(ProjectService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should have projectService injected correctly', () => {
    expect(controller['projectService']).toBeDefined();
    expect(typeof controller['projectService'].create).toBe('function');
  });

  it('should call service create when creating a project', async () => {
    const createProjectDto = {
      name: 'Test Project',
      status: 'draft',
    };

    mockProjectsService.create.mockResolvedValue(mockProject);

    const result = await controller.create(createProjectDto, 'org1');

    expect(mockProjectsService.create).toHaveBeenCalledWith(createProjectDto);
    expect(result).toEqual(mockProject);
  });

  it('should call service findAll when getting all projects', async () => {
    const projects = [mockProject];
    mockProjectsService.findAll.mockResolvedValue(projects);

    const result = await controller.findAll();

    expect(mockProjectsService.findAll).toHaveBeenCalledWith('summary');
    expect(result).toEqual(projects);
  });

  it('should call service findOne when getting a single project', async () => {
    mockProjectsService.findOne.mockResolvedValue(mockProject);

    const result = await controller.findOne('1');

    expect(mockProjectsService.findOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockProject);
  });

  it('should call service update when updating a project', async () => {
    const updateProjectDto = { name: 'Updated Project' };
    const updatedProject = { ...mockProject, name: 'Updated Project' };
    mockProjectsService.update.mockResolvedValue(updatedProject);

    const result = await controller.update('1', updateProjectDto);

    expect(mockProjectsService.update).toHaveBeenCalledWith(
      '1',
      updateProjectDto
    );
    expect(result).toEqual(updatedProject);
  });

  it('should call service remove when deleting a project', async () => {
    mockProjectsService.remove.mockResolvedValue(mockProject);

    const result = await controller.remove('1');

    expect(mockProjectsService.remove).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockProject);
  });

  it('should call service getProjectStats when getting project stats', async () => {
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

    expect(mockProjectsService.getProjectStats).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockStats);
  });
});
