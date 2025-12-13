import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  TaskService,
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  CreateTaskCommentDto,
  CreateTimeEntryDto,
  CreateTaskDependencyDto,
} from './task.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('tasks')
@UseGuards(AuthGuard, RolesGuard)
@Controller('projects/:projectId/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() reporterId: string
  ) {
    return this.taskService.create(
      { ...createTaskDto, reporterId },
      projectId,
      organizationId
    );
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Get all tasks for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'assigneeId',
    required: false,
    description: 'Filter by assignee',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    description: 'Filter by priority',
  })
  @ApiQuery({
    name: 'milestoneId',
    required: false,
    description: 'Filter by milestone',
  })
  @ApiQuery({
    name: 'parentTaskId',
    required: false,
    description: 'Filter by parent task',
  })
  @ApiQuery({
    name: 'labels',
    required: false,
    description: 'Filter by labels (comma-separated)',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Filter by tags (comma-separated)',
  })
  @ApiQuery({
    name: 'dueSoon',
    required: false,
    description: 'Show tasks due soon (within 3 days)',
  })
  @ApiQuery({
    name: 'overdue',
    required: false,
    description: 'Show overdue tasks',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in title and description',
  })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (asc/desc)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Param('projectId') projectId: string,
    @Query() query: TaskQueryDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    // Parse array parameters
    if (query.labels && typeof query.labels === 'string') {
      query.labels = query.labels
        .split(',')
        .map((label: string) => label.trim());
    }
    if (query.tags && typeof query.tags === 'string') {
      query.tags = query.tags.split(',').map((tag: string) => tag.trim());
    }

    return this.taskService.findAll(projectId, query);
  }

  @Get('stats')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Get task statistics for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async getStats(
    @Param('projectId') projectId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.getTaskStats(projectId, organizationId);
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Get a specific task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.update(id, updateTaskDto, organizationId);
  }

  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async remove(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.remove(id, organizationId);
  }

  // Task Comments
  @Post(':id/comments')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateTaskCommentDto,
    @CurrentUserId() authorId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.addComment(
      id,
      createCommentDto,
      authorId,
      organizationId
    );
  }

  // Time Tracking
  @Post(':id/time-entries')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Add time entry to a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async addTimeEntry(
    @Param('id') id: string,
    @Body() createTimeEntryDto: CreateTimeEntryDto,
    @CurrentUserId() userId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.addTimeEntry(
      id,
      createTimeEntryDto,
      userId,
      organizationId
    );
  }

  // Task Dependencies
  @Post(':id/dependencies')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Add dependency to a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async addDependency(
    @Param('id') id: string,
    @Body() createDependencyDto: CreateTaskDependencyDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.addDependency(
      id,
      createDependencyDto,
      organizationId
    );
  }

  // Task Watchers
  @Post(':id/watchers')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Add watcher to a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async addWatcher(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.addWatcher(id, userId, organizationId);
  }

  @Delete(':id/watchers/:userId')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  @ApiOperation({ summary: 'Remove watcher from a task' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove as watcher' })
  async removeWatcher(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.removeWatcher(id, userId, organizationId);
  }
}
