import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TaskDependenciesService } from './task-dependencies.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';

@Controller('task-dependencies')
@UseGuards(AuthGuard, MultiTenantGuard)
export class TaskDependenciesController {
  constructor(private readonly taskDependenciesService: TaskDependenciesService) {}

  @Post()
  async create(
    @CurrentOrganizationId() organizationId: string,
    @Body() createTaskDependencyDto: { taskId: string; dependsOnTask: string; type: string }
  ) {
    // TODO: Verify that both tasks belong to the same organization
    return await this.taskDependenciesService.createDependency(createTaskDependencyDto);
  }

  @Get(':taskId')
  async getDependencies(
    @Param('taskId') taskId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    // TODO: Verify that task belongs to the organization
    return await this.taskDependenciesService.getDependenciesForTask(taskId);
  }

  @Get('dependents/:taskId')
  async getDependents(
    @Param('taskId') taskId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    // TODO: Verify that task belongs to the organization
    return await this.taskDependenciesService.getDependentsForTask(taskId);
  }

  @Delete(':taskId/:dependsOnTask')
  async delete(
    @Param('taskId') taskId: string,
    @Param('dependsOnTask') dependsOnTask: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    // TODO: Verify that both tasks belong to the organization
    return await this.taskDependenciesService.deleteDependency(taskId, dependsOnTask);
  }

  @Post('check-conflict')
  async checkConflict(
    @CurrentOrganizationId() organizationId: string,
    @Body() body: { taskId: string; dependsOnTask: string }
  ) {
    return await this.taskDependenciesService.checkDependencyConflicts(body.taskId, body.dependsOnTask);
  }
}