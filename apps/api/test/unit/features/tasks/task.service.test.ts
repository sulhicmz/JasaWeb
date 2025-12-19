import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { CreateTaskDto, TaskStatus, TaskPriority } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  createMockMultiTenantPrismaService,
  TestUtils,
  clearAllMocks,
} from '@jasaweb/testing';

describe('TaskService', () => {
  let service: TaskService;

  const mockPrisma = createMockMultiTenantPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
  });

  afterEach(() => {
    clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createTaskDto: CreateTaskDto = {
        projectId: 'project-1',
        title: 'Test Task',
        description: 'Test description',
        assignedTo: 'user-1',
        dueAt: new Date('2024-12-31'),
        priority: TaskPriority.HIGH,
      };

      const project = createTestProject({
        id: 'project-1',
        organizationId: 'org-1',
      });

      const assignedUser = {
        id: 'user-1',
        name: 'Test User',
      };

      const result = createTestTask({
        id: 'task-1',
        title: 'Test Task',
        status: TaskStatus.TODO,
      });

      mockPrisma.project.findUnique.mockResolvedValue(project);
      mockPrisma.user.findUnique.mockResolvedValue(assignedUser);
      mockPrisma.task.create.mockResolvedValue(result);

      const response = await service.create(createTaskDto, 'org-1');

      expect(response).toEqual(result);
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Task',
          description: 'Test description',
          assignedUser: { connect: { id: 'user-1' } },
          status: TaskStatus.TODO,
          dueAt: new Date('2024-12-31'),
          labels: [],
          createdBy: { connect: { id: 'user_id_placeholder' } },
          project: { connect: { id: 'project-1' } },
        },
      });
    });

    it('should throw error if project does not belong to organization', async () => {
      const createTaskDto: CreateTaskDto = {
        projectId: 'project-1',
        title: 'Test Task',
      };

      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.create(createTaskDto, 'org-1')).rejects.toThrow(
        'Project does not exist or does not belong to your organization'
      );
    });
  });

  describe('findAll', () => {
    it('should return tasks for project', async () => {
      const tasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ];

      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAll('project-1');

      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
      });
    });

    it('should return all tasks when no projectId provided', async () => {
      const tasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ];

      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAll();

      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {},
      });
    });
  });

  describe('update', () => {
    it('should update task', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.COMPLETED,
      };

      const existingTask = {
        id: 'task-1',
        title: 'Original Task',
      };

      const result = {
        id: 'task-1',
        title: 'Updated Task',
        status: TaskStatus.COMPLETED,
      };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue(result);

      const response = await service.update('task-1', updateTaskDto);

      expect(response).toEqual(result);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: updateTaskDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove task', async () => {
      const task = {
        id: 'task-1',
        title: 'Test Task',
      };

      mockPrisma.task.findUnique.mockResolvedValue(task);
      mockPrisma.task.delete.mockResolvedValue({ id: 'task-1' });

      const result = await service.remove('task-1');

      expect(result).toEqual({ id: 'task-1' });
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });
  });

  describe('findByStatus', () => {
    it('should return tasks by status', async () => {
      const tasks = [{ id: '1', title: 'Task 1', status: TaskStatus.TODO }];

      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findByStatus(TaskStatus.TODO, 'project-1');

      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          status: TaskStatus.TODO,
          projectId: 'project-1',
        },
      });
    });
  });

  describe('findByAssignee', () => {
    it('should return tasks by assignee', async () => {
      const tasks = [{ id: '1', title: 'Task 1', assignedUserId: 'user-1' }];

      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findByAssignee('user-1', 'project-1');

      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          assignedUserId: 'user-1',
          projectId: 'project-1',
        },
      });
    });
  });
});
