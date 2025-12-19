<<<<<<< Updated upstream
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

=======
import { BadRequestException, Injectable } from '@nestjs/common';
>>>>>>> Stashed changes
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { CreateTaskDto, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  async create(
    createTaskDto: CreateTaskDto,
    organizationId: string,
    userId: string
  ) {
    try {
      // Validate that the project belongs to the organization
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: createTaskDto.projectId },
      });

      if (!project || project.organizationId !== organizationId) {
        throw new BadRequestException(
          'Project does not exist or does not belong to your organization'
        );
      }

      const task = await this.multiTenantPrisma.task.create({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          assignedUser: createTaskDto.assignedTo
            ? {
                connect: { id: createTaskDto.assignedTo },
              }
            : undefined,
          status: createTaskDto.status || TaskStatus.TODO,
          dueAt: createTaskDto.dueAt,
          labels: [],
          createdBy: {
            connect: { id: userId },
          },
          project: {
            connect: { id: createTaskDto.projectId },
          },
        },
      });

      this.logger.log(
        `Task created successfully: ${task.id} by user: ${userId}`
      );
      return task;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create task: ${errorMessage}`, errorStack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  async findAll(projectId?: string, _organizationId: string = '') {
    if (projectId) {
      // Validate project exists and belongs to organization
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new BadRequestException(
          'Project does not exist or does not belong to your organization'
        );
      }

      return await this.multiTenantPrisma.task.findMany({
        where: { projectId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      return await this.multiTenantPrisma.task.findMany({
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }
  }

  async findOne(id: string, organizationId: string) {
    // First find the task to get its projectId
    const taskWithoutRelations = await this.multiTenantPrisma.task.findUnique({
      where: { id },
      select: { projectId: true, id: true },
    });

    if (!taskWithoutRelations) {
      throw new BadRequestException('Task not found');
    }

    // Validate that the project belongs to the organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: taskWithoutRelations.projectId },
      select: { id: true, name: true, organizationId: true },
    });

    if (!project || project.organizationId !== organizationId) {
      throw new BadRequestException(
        'Task not found or does not belong to your organization'
      );
    }

    // Now get the full task with relations
    const task = await this.multiTenantPrisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    organizationId: string
  ) {
    // First find the task to get its projectId
    const taskWithoutRelations = await this.multiTenantPrisma.task.findUnique({
<<<<<<< Updated upstream
=======
  async update(id: string, updateTaskDto: UpdateTaskDto) {
<<<<<<< HEAD
    // Check if task exists
    const existingTask = await this.multiTenantPrisma.task.findUnique({
>>>>>>> origin/main
=======
>>>>>>> Stashed changes
      where: { id },
      select: { projectId: true, id: true },
    });

    if (!taskWithoutRelations) {
      throw new BadRequestException('Task not found');
    }

    // Validate that the project belongs to the organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: taskWithoutRelations.projectId },
      select: { id: true, organizationId: true },
    });

    if (!project || project.organizationId !== organizationId) {
      throw new BadRequestException(
        'Task not found or does not belong to your organization'
=======
    try {
      // Check if task exists
      const existingTask = await this.multiTenantPrisma.task.findUnique({
        where: { id },
      });

      if (!existingTask) {
        throw new NotFoundException('Task not found');
      }

      const task = await this.multiTenantPrisma.task.update({
        where: { id },
        data: updateTaskDto,
      });

      this.logger.log(`Task updated successfully: ${task.id}`);
      return task;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update task ${id}: ${errorMessage}`,
        errorStack
>>>>>>> origin/dev
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update task');
    }
  }

  async remove(id: string, organizationId: string) {
    // First find the task to get its projectId
    const taskWithoutRelations = await this.multiTenantPrisma.task.findUnique({
      where: { id },
      select: { projectId: true, id: true },
    });

    if (!taskWithoutRelations) {
      throw new BadRequestException('Task not found');
    }

    // Validate that the project belongs to the organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: taskWithoutRelations.projectId },
      select: { id: true, organizationId: true },
    });

    if (!project || project.organizationId !== organizationId) {
      throw new BadRequestException(
        'Task not found or does not belong to your organization'
      );
    }

    return await this.multiTenantPrisma.task.delete({
      where: { id },
    });
  }

  // Business logic methods
  async findByStatus(status: string, projectId?: string) {
    const whereClause: Record<string, unknown> = { status };
    if (projectId) {
      whereClause.projectId = projectId;
    }

    return this.multiTenantPrisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findByAssignee(assignedTo: string, projectId?: string) {
    const whereClause: Record<string, unknown> = { assignedTo };
    if (projectId) {
      whereClause.projectId = projectId;
    }

    return this.multiTenantPrisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getTaskStats(projectId?: string) {
    const whereClause = projectId ? { projectId } : {};

    const tasks = (await this.multiTenantPrisma.task.findMany({
      where: whereClause,
    })) as Array<{ status: string }>;

    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;

    return {
      total,
      todo,
      inProgress,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
