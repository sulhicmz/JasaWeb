import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { vi } from 'vitest';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  const mockTaskService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto: CreateTaskDto = {
        projectId: 'project-1',
        title: 'Test Task',
        description: 'Test description',
        assignedTo: 'user-1',
        dueAt: new Date('2024-12-31'),
        priority: 'HIGH' as any,
      };

      const result = {
        id: '1',
        ...createTaskDto,
        status: TaskStatus.TODO,
      };

      mockTaskService.create.mockResolvedValue(result);

      const response = await controller.create(createTaskDto, 'org-1');

      expect(response).toEqual(result);
      expect(mockTaskService.create).toHaveBeenCalledWith(
        createTaskDto,
        'org-1'
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const tasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ];

      mockTaskService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll('project-1');

      expect(result).toEqual(tasks);
      expect(mockTaskService.findAll).toHaveBeenCalledWith(
        'project-1',
        'org-1'
      );
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const task = { id: '1', title: 'Test Task' };

      mockTaskService.findOne.mockResolvedValue(task);

      const result = await controller.findOne('1');

      expect(result).toEqual(task);
      expect(mockTaskService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.COMPLETED,
      };

      const result = {
        id: '1',
        title: 'Updated Task',
        status: TaskStatus.COMPLETED,
      };

      mockTaskService.update.mockResolvedValue(result);

      const response = await controller.update('1', updateTaskDto);

      expect(response).toEqual(result);
      expect(mockTaskService.update).toHaveBeenCalledWith('1', updateTaskDto);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      const result = { id: '1' };
      mockTaskService.remove.mockResolvedValue(result);

      const response = await controller.remove('1');

      expect(response).toEqual(result);
      expect(mockTaskService.remove).toHaveBeenCalledWith('1');
    });
  });
});
