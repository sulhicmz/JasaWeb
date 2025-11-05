import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Role } from '../common/decorators/roles.decorator';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProjectController', () => {
  let controller: ProjectController;
  let service: jest.Mocked<ProjectService>;

  const mockProjectService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get(ProjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project successfully', async () => {
      const createProjectDto = {
        name: 'Test Project',
        description: 'Test Description',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const organizationId = 'org-123';
      const expectedResult = {
        id: 1,
        ...createProjectDto,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createProjectDto, organizationId);

      expect(service.create).toHaveBeenCalledWith(createProjectDto, organizationId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle creation errors', async () => {
      const createProjectDto = {
        name: 'Test Project',
        description: 'Test Description',
      };

      const organizationId = 'org-123';

      mockProjectService.create.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(controller.create(createProjectDto, organizationId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('findAll', () => {
    it('should return projects in summary view by default', async () => {
      const expectedResult = [
        {
          id: 1,
          name: 'Project 1',
          status: 'active',
        },
        {
          id: 2,
          name: 'Project 2',
          status: 'completed',
        },
      ];

      mockProjectService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith('summary');
      expect(result).toEqual(expectedResult);
    });

    it('should return projects in detail view when specified', async () => {
      const expectedResult = [
        {
          id: 1,
          name: 'Project 1',
          description: 'Detailed description',
          status: 'active',
          milestones: [],
          tickets: [],
        },
      ];

      mockProjectService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll('detail');

      expect(service.findAll).toHaveBeenCalledWith('detail');
      expect(result).toEqual(expectedResult);
    });

    it('should normalize view parameter', async () => {
      const expectedResult = [];

      mockProjectService.findAll.mockResolvedValue(expectedResult);

      await controller.findAll('DETAIL');

      expect(service.findAll).toHaveBeenCalledWith('detail');
    });

    it('should handle empty results', async () => {
      mockProjectService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single project', async () => {
      const projectId = '1';
      const expectedResult = {
        id: 1,
        name: 'Test Project',
        description: 'Test Description',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(projectId);

      expect(service.findOne).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle project not found', async () => {
      const projectId = '999';

      mockProjectService.findOne.mockRejectedValue(
        new NotFoundException('Project not found')
      );

      await expect(controller.findOne(projectId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update a project successfully', async () => {
      const projectId = '1';
      const updateProjectDto = {
        name: 'Updated Project Name',
        description: 'Updated Description',
      };

      const expectedResult = {
        id: 1,
        name: 'Updated Project Name',
        description: 'Updated Description',
        status: 'active',
        updatedAt: new Date(),
      };

      mockProjectService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(projectId, updateProjectDto);

      expect(service.update).toHaveBeenCalledWith(projectId, updateProjectDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle update errors', async () => {
      const projectId = '999';
      const updateProjectDto = {
        name: 'Updated Name',
      };

      mockProjectService.update.mockRejectedValue(
        new NotFoundException('Project not found')
      );

      await expect(controller.update(projectId, updateProjectDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle permission errors', async () => {
      const projectId = '1';
      const updateProjectDto = {
        name: 'Updated Name',
      };

      mockProjectService.update.mockRejectedValue(
        new ForbiddenException('Insufficient permissions')
      );

      await expect(controller.update(projectId, updateProjectDto)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('remove', () => {
    it('should remove a project successfully', async () => {
      const projectId = '1';

      const expectedResult = {
        id: 1,
        name: 'Test Project',
        status: 'deleted',
        deletedAt: new Date(),
      };

      mockProjectService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(projectId);

      expect(service.remove).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle project not found', async () => {
      const projectId = '999';

      mockProjectService.remove.mockRejectedValue(
        new NotFoundException('Project not found')
      );

      await expect(controller.remove(projectId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle permission errors', async () => {
      const projectId = '1';

      mockProjectService.remove.mockRejectedValue(
        new ForbiddenException('Only organization owners can delete projects')
      );

      await expect(controller.remove(projectId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});