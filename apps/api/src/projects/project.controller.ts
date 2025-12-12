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
import {
  ProjectService,
  CreateProjectDto,
  UpdateProjectDto,
} from './project.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DashboardService } from '../dashboard/dashboard.service';

@Controller('projects')
@UseGuards(RolesGuard) // Use the roles guard
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly dashboardService: DashboardService
  ) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only these roles can create projects
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    const project = await this.projectService.create(
      createProjectDto,
      organizationId
    );

    // Notify dashboard of new project
    await this.dashboardService.notifyProjectUpdate(organizationId, project.id);
    await this.dashboardService.notifyStatsUpdate(organizationId);

    return project;
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findAll(@Query('view') view?: string) {
    const normalizedView =
      view?.toLowerCase() === 'detail' ? 'detail' : 'summary';
    return this.projectService.findAll(normalizedView);
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can update
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    const project = await this.projectService.update(id, updateProjectDto);

    // Notify dashboard of project update
    await this.dashboardService.notifyProjectUpdate(organizationId, id);
    await this.dashboardService.notifyStatsUpdate(organizationId);

    return project;
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner) // Only org owner can delete
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}
