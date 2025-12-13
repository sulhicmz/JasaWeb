import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Role } from '../common/decorators/roles.decorator';

export interface CreateTaskDto {
  title: string;
  description?: string;
  assigneeId?: string;
  reporterId?: string;
  status?: string;
  priority?: string;
  dueAt?: Date;
  startAt?: Date;
  estimatedHours?: number;
  labels?: string[];
  tags?: string[];
  parentTaskId?: string;
  milestoneId?: string;
  templateId?: string;
  position?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  dueAt?: Date;
  startAt?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  labels?: string[];
  tags?: string[];
  parentTaskId?: string;
  milestoneId?: string;
  position?: number;
}

export interface TaskQueryDto {
  status?: string;
  assigneeId?: string;
  priority?: string;
  milestoneId?: string;
  parentTaskId?: string;
  labels?: string[] | string;
  tags?: string[] | string;
  dueSoon?: boolean;
  overdue?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueAt' | 'priority' | 'position';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateTaskCommentDto {
  content: string;
}

export interface CreateTimeEntryDto {
  description?: string;
  hours: number;
  date: Date;
}

export interface CreateTaskDependencyDto {
  dependsOnTaskId: string;
  type?:
    | 'finish_to_start'
    | 'start_to_start'
    | 'finish_to_finish'
    | 'start_to_finish';
}

const taskRelationsInclude = {
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
    },
  },
  reporter: {
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
    },
  },
  parentTask: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  subtasks: {
    select: {
      id: true,
      title: true,
      status: true,
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  milestone: {
    select: {
      id: true,
      title: true,
      status: true,
      dueAt: true,
    },
  },
  template: {
    select: {
      id: true,
      name: true,
      category: true,
    },
  },
  dependencies: {
    include: {
      dependsOnTask: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  },
  dependents: {
    include: {
      dependentTask: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  },
  comments: {
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  timeEntries: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  },
  attachments: true,
  watchers: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: {
      subtasks: true,
      comments: true,
      timeEntries: true,
      attachments: true,
    },
  },
} as const;

@Injectable()
export class TaskService {
  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly prisma: any // Will be injected via MultiTenantPrismaService
  ) {
    // Access the underlying prisma client for operations that need direct access
    this.prisma = (multiTenantPrisma as any).prisma;
  }

  async create(
    createTaskDto: CreateTaskDto,
    projectId: string,
    organizationId: string
  ) {
    // Validate project exists and belongs to organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }

    // Validate assignee exists and is member of organization
    if (createTaskDto.assigneeId) {
      const membership = await this.multiTenantPrisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: createTaskDto.assigneeId,
            organizationId,
          },
        },
      });

      if (!membership) {
        throw new BadRequestException(
          'Assignee is not a member of this organization'
        );
      }
    }

    // Validate parent task exists and belongs to same project
    if (createTaskDto.parentTaskId) {
      const parentTask = await this.multiTenantPrisma.task.findUnique({
        where: { id: createTaskDto.parentTaskId },
      });

      if (!parentTask || parentTask.projectId !== projectId) {
        throw new BadRequestException('Parent task not found in this project');
      }
    }

    // Validate milestone exists and belongs to same project
    if (createTaskDto.milestoneId) {
      const milestone = await this.multiTenantPrisma.milestone.findUnique({
        where: { id: createTaskDto.milestoneId },
      });

      if (!milestone || milestone.projectId !== projectId) {
        throw new BadRequestException('Milestone not found in this project');
      }
    }

    // Get next position if not provided
    let position = createTaskDto.position;
    if (position === undefined) {
      const lastTask = await this.multiTenantPrisma.task.findFirst({
        where: { projectId },
        orderBy: { position: 'desc' },
      });
      position = (lastTask?.position || 0) + 1;
    }

    const task = await this.multiTenantPrisma.task.create({
      data: {
        ...createTaskDto,
        projectId,
        position,
        status: createTaskDto.status || 'todo',
        priority: createTaskDto.priority || 'medium',
      },
      include: taskRelationsInclude,
    });

    // Add reporter as watcher if different from assignee
    if (
      createTaskDto.reporterId &&
      createTaskDto.reporterId !== createTaskDto.assigneeId
    ) {
      await this.multiTenantPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: createTaskDto.reporterId,
        },
      });
    }

    // Add assignee as watcher if different from reporter
    if (
      createTaskDto.assigneeId &&
      createTaskDto.assigneeId !== createTaskDto.reporterId
    ) {
      await this.multiTenantPrisma.taskWatcher.create({
        data: {
          taskId: task.id,
          userId: createTaskDto.assigneeId,
        },
      });
    }

    return task;
  }

  async findAll(projectId: string, query: TaskQueryDto = {}) {
    const where: any = { projectId };

    // Build filters
    if (query.status) {
      where.status = query.status;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.milestoneId) {
      where.milestoneId = query.milestoneId;
    }

    if (query.parentTaskId) {
      where.parentTaskId = query.parentTaskId;
    }

    if (query.labels && query.labels.length > 0) {
      where.labels = { hasSome: query.labels };
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { hasSome: query.tags };
    }

    if (query.dueSoon) {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      where.dueAt = {
        lte: threeDaysFromNow,
        gte: new Date(),
      };
      where.status = { not: 'completed' };
    }

    if (query.overdue) {
      where.dueAt = { lt: new Date() };
      where.status = { not: 'completed' };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build ordering
    const orderBy: any = {};
    const sortBy = query.sortBy || 'position';
    const sortOrder = query.sortOrder || 'asc';
    orderBy[sortBy] = sortOrder;

    // Build pagination
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.multiTenantPrisma.task.findMany({
        where,
        include: taskRelationsInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.multiTenantPrisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        ...taskRelationsInclude,
        project: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });

    if (!task || task.project.organizationId !== organizationId) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    organizationId: string
  ) {
    // Verify task exists and user has access
    const existingTask = await this.findOne(id, organizationId);

    // Validate assignee if changed
    if (
      updateTaskDto.assigneeId &&
      updateTaskDto.assigneeId !== existingTask.assigneeId
    ) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: updateTaskDto.assigneeId,
            organizationId: existingTask.project.organizationId,
          },
        },
      });

      if (!membership) {
        throw new BadRequestException(
          'Assignee is not a member of this organization'
        );
      }

      // Add new assignee as watcher
      await this.prisma.taskWatcher.upsert({
        where: {
          taskId_userId: {
            taskId: id,
            userId: updateTaskDto.assigneeId,
          },
        },
        update: {},
        create: {
          taskId: id,
          userId: updateTaskDto.assigneeId,
        },
      });
    }

    // Auto-set completedAt when status changes to completed
    if (
      updateTaskDto.status === 'completed' &&
      existingTask.status !== 'completed'
    ) {
      updateTaskDto.completedAt = new Date();
    } else if (
      updateTaskDto.status !== 'completed' &&
      existingTask.status === 'completed'
    ) {
      updateTaskDto.completedAt = undefined;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: taskRelationsInclude,
    });

    return updatedTask;
  }

  async remove(id: string, organizationId: string) {
    // Verify task exists and user has access
    await this.findOne(id, organizationId);

    // Check if task has subtasks
    const subtaskCount = await this.multiTenantPrisma.task.count({
      where: { parentTaskId: id },
    });

    if (subtaskCount > 0) {
      throw new BadRequestException(
        'Cannot delete task with subtasks. Delete subtasks first.'
      );
    }

    return this.multiTenantPrisma.task.delete({
      where: { id },
    });
  }

  // Task Comments
  async addComment(
    taskId: string,
    createCommentDto: CreateTaskCommentDto,
    authorId: string,
    organizationId: string
  ) {
    // Verify task exists and user has access
    await this.findOne(taskId, organizationId);

    return this.prisma.taskComment.create({
      data: {
        taskId,
        authorId,
        content: createCommentDto.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  // Time Tracking
  async addTimeEntry(
    taskId: string,
    createTimeEntryDto: CreateTimeEntryDto,
    userId: string,
    organizationId: string
  ) {
    // Verify task exists and user has access
    await this.findOne(taskId, organizationId);

    const timeEntry = await this.prisma.timeEntry.create({
      data: {
        taskId,
        userId,
        ...createTimeEntryDto,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update task actual hours
    const totalHours = await this.prisma.timeEntry.aggregate({
      where: { taskId },
      _sum: { hours: true },
    });

    await this.multiTenantPrisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalHours._sum?.hours || 0 },
    });

    return timeEntry;
  }

  // Task Dependencies
  async addDependency(
    taskId: string,
    createDependencyDto: CreateTaskDependencyDto,
    organizationId: string
  ) {
    // Verify both tasks exist and user has access
    await this.findOne(taskId, organizationId);
    await this.findOne(createDependencyDto.dependsOnTaskId, organizationId);

    // Check for circular dependencies
    const wouldCreateCircularDependency = await this.checkCircularDependency(
      taskId,
      createDependencyDto.dependsOnTaskId
    );

    if (wouldCreateCircularDependency) {
      throw new BadRequestException(
        'This dependency would create a circular reference'
      );
    }

    return this.prisma.taskDependency.create({
      data: {
        dependentTaskId: taskId,
        dependsOnTaskId: createDependencyDto.dependsOnTaskId,
        type: createDependencyDto.type || 'finish_to_start',
      },
      include: {
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  private async checkCircularDependency(
    taskId: string,
    dependsOnTaskId: string
  ): Promise<boolean> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = async (currentTaskId: string): Promise<boolean> => {
      if (recursionStack.has(currentTaskId)) {
        return true;
      }

      if (visited.has(currentTaskId)) {
        return false;
      }

      visited.add(currentTaskId);
      recursionStack.add(currentTaskId);

      const dependencies = await this.prisma.taskDependency.findMany({
        where: { dependentTaskId: currentTaskId },
        select: { dependsOnTaskId: true },
      });

      for (const dep of dependencies) {
        if (await hasCycle(dep.dependsOnTaskId)) {
          return true;
        }
      }

      recursionStack.delete(currentTaskId);
      return false;
    };

    return hasCycle(dependsOnTaskId);
  }

  // Task Watchers
  async addWatcher(taskId: string, userId: string, organizationId: string) {
    // Verify task exists and user has access
    await this.findOne(taskId, organizationId);

    return this.prisma.taskWatcher.upsert({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
      update: {},
      create: {
        taskId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeWatcher(taskId: string, userId: string, organizationId: string) {
    // Verify task exists and user has access
    await this.findOne(taskId, organizationId);

    return this.prisma.taskWatcher.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });
  }

  // Analytics and Reporting
  async getTaskStats(projectId: string, organizationId: string) {
    // Verify project exists and user has access
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organizationId !== organizationId) {
      throw new NotFoundException('Project not found');
    }

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      tasksDueThisWeek,
      totalEstimatedHours,
      totalActualHours,
    ] = await Promise.all([
      this.multiTenantPrisma.task.count({ where: { projectId } }),
      this.multiTenantPrisma.task.count({
        where: { projectId, status: 'completed' },
      }),
      this.multiTenantPrisma.task.count({
        where: { projectId, status: 'in-progress' },
      }),
      this.multiTenantPrisma.task.count({
        where: { projectId, status: 'todo' },
      }),
      this.multiTenantPrisma.task.count({
        where: {
          projectId,
          dueAt: { lt: new Date() },
          status: { not: 'completed' },
        },
      }),
      this.multiTenantPrisma.task.count({
        where: {
          projectId,
          dueAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          },
          status: { not: 'completed' },
        },
      }),
      this.prisma.task.aggregate({
        where: { projectId },
        _sum: { estimatedHours: true },
      }),
      this.prisma.task.aggregate({
        where: { projectId },
        _sum: { actualHours: true },
      }),
    ]);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      tasksDueThisWeek,
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalEstimatedHours: totalEstimatedHours._sum?.estimatedHours || 0,
      totalActualHours: totalActualHours._sum?.actualHours || 0,
      hoursVariance:
        (totalEstimatedHours._sum?.estimatedHours || 0) -
        (totalActualHours._sum?.actualHours || 0),
    };
  }
}
