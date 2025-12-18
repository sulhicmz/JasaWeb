import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('tasks')
@UseGuards(RolesGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.taskService.create(createTaskDto, organizationId);
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async findAll(@Query('projectId') projectId?: string) {
    return this.taskService.findAll(projectId);
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, updateTaskDto);
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }

  @Get('status/:status')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async findByStatus(
    @Param('status') status: string,
    @Query('projectId') projectId?: string
  ) {
    return this.taskService.findByStatus(status, projectId);
  }

  @Get('assignee/:assignedTo')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async findByAssignee(
    @Param('assignedTo') assignedTo: string,
    @Query('projectId') projectId?: string
  ) {
    return this.taskService.findByAssignee(assignedTo, projectId);
  }
}
