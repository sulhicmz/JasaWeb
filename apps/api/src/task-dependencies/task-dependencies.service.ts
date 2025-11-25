import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

export interface CreateTaskDependencyDto {
  taskId: string;
  dependsOnTask: string;
  type: string; // finish_to_start, start_to_start, etc.
}

@Injectable()
export class TaskDependenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async createDependency(createTaskDependencyDto: CreateTaskDependencyDto) {
    return await this.prisma.taskDependency.create({
      data: {
        taskId: createTaskDependencyDto.taskId,
        dependsOnTask: createTaskDependencyDto.dependsOnTask,
        type: createTaskDependencyDto.type,
      },
    });
  }

  async getDependenciesForTask(taskId: string) {
    return await this.prisma.taskDependency.findMany({
      where: {
        taskId,
      },
      include: {
        dependantTask: true,
        dependencyTask: true,
      },
    });
  }

  async getDependentsForTask(taskId: string) {
    return await this.prisma.taskDependency.findMany({
      where: {
        dependsOnTask: taskId,
      },
      include: {
        dependantTask: true,
        dependencyTask: true,
      },
    });
  }

  async deleteDependency(taskId: string, dependsOnTask: string) {
    return await this.prisma.taskDependency.deleteMany({
      where: {
        taskId,
        dependsOnTask,
      },
    });
  }

  async checkDependencyConflicts(taskId: string, dependsOnTask: string) {
    // Check for circular dependencies
    const allDependents = await this.getAllDependents(dependsOnTask);
    if (allDependents.includes(taskId)) {
      return {
        hasConflict: true,
        message: 'Creating this dependency would cause a circular dependency',
      };
    }
    
    return { hasConflict: false };
  }

  private async getAllDependents(taskId: string): Promise<string[]> {
    const dependents = await this.prisma.taskDependency.findMany({
      where: {
        dependsOnTask: taskId,
      },
      select: {
        taskId: true,
      },
    });

    const allDependents: string[] = dependents.map(d => d.taskId);
    
    // Recursively get all dependents of dependents
    for (const dependent of dependents) {
      const nestedDependents = await this.getAllDependents(dependent.taskId);
      allDependents.push(...nestedDependents);
    }
    
    return allDependents;
  }
}