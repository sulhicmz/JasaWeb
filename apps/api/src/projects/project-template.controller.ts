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
import { ProjectTemplateService } from './project-template.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateProjectTemplateDto,
  UpdateProjectTemplateDto,
  CreateMilestoneTemplateDto,
  CreateTaskTemplateDto,
} from './project-template.service';

@Controller('project-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectTemplateController {
  constructor(
    private readonly projectTemplateService: ProjectTemplateService
  ) {}

  // Project Template endpoints
  @Post()
  @Roles('admin', 'owner')
  create(@Body() createDto: CreateProjectTemplateDto) {
    return this.projectTemplateService.createProjectTemplate(createDto);
  }

  @Get()
  findAll() {
    return this.projectTemplateService.findAllProjectTemplates();
  }

  @Get('service-type/:serviceType')
  findByServiceType(@Param('serviceType') serviceType: string) {
    return this.projectTemplateService.findProjectTemplatesByServiceType(
      serviceType
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectTemplateService.findProjectTemplateById(id);
  }

  @Patch(':id')
  @Roles('admin', 'owner')
  update(@Param('id') id: string, @Body() updateDto: UpdateProjectTemplateDto) {
    return this.projectTemplateService.updateProjectTemplate(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin', 'owner')
  remove(@Param('id') id: string) {
    return this.projectTemplateService.deleteProjectTemplate(id);
  }

  // Template Application
  @Post(':id/apply')
  @Roles('admin', 'owner')
  applyTemplate(
    @Param('id') templateId: string,
    @Body() projectData: { name: string; startAt?: Date; dueAt?: Date },
    @Request() req
  ) {
    return this.projectTemplateService.applyTemplateToProject(templateId, {
      ...projectData,
      organizationId: req.user.organizationId,
    });
  }

  // Milestone Template endpoints
  @Post(':templateId/milestones')
  @Roles('admin', 'owner')
  createMilestoneTemplate(
    @Param('templateId') projectTemplateId: string,
    @Body() createDto: Omit<CreateMilestoneTemplateDto, 'projectTemplateId'>
  ) {
    return this.projectTemplateService.createMilestoneTemplate({
      ...createDto,
      projectTemplateId,
    });
  }

  @Patch('milestones/:id')
  @Roles('admin', 'owner')
  updateMilestoneTemplate(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateMilestoneTemplateDto>
  ) {
    return this.projectTemplateService.updateMilestoneTemplate(id, updateDto);
  }

  @Delete('milestones/:id')
  @Roles('admin', 'owner')
  removeMilestoneTemplate(@Param('id') id: string) {
    return this.projectTemplateService.deleteMilestoneTemplate(id);
  }

  // Task Template endpoints
  @Post('milestones/:milestoneTemplateId/tasks')
  @Roles('admin', 'owner')
  createTaskTemplate(
    @Param('milestoneTemplateId') milestoneTemplateId: string,
    @Body() createDto: Omit<CreateTaskTemplateDto, 'milestoneTemplateId'>
  ) {
    return this.projectTemplateService.createTaskTemplate({
      ...createDto,
      milestoneTemplateId,
    });
  }

  @Patch('tasks/:id')
  @Roles('admin', 'owner')
  updateTaskTemplate(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateTaskTemplateDto>
  ) {
    return this.projectTemplateService.updateTaskTemplate(id, updateDto);
  }

  @Delete('tasks/:id')
  @Roles('admin', 'owner')
  removeTaskTemplate(@Param('id') id: string) {
    return this.projectTemplateService.deleteTaskTemplate(id);
  }

  // Analytics endpoints
  @Get('analytics/usage-stats')
  @Roles('admin', 'owner')
  getUsageStats() {
    return this.projectTemplateService.getTemplateUsageStats();
  }

  @Get(':id/analytics/effectiveness')
  @Roles('admin', 'owner')
  getEffectivenessMetrics(@Param('id') templateId: string) {
    return this.projectTemplateService.getTemplateEffectivenessMetrics(
      templateId
    );
  }
}
