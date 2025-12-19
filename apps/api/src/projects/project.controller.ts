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
import { ProjectService } from './project.service';
import type { CreateProjectDto, UpdateProjectDto } from './project.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('projects')
@UseGuards(AuthGuard, RolesGuard) // Use authentication and roles guard
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

<<<<<<< HEAD
  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only these roles can create projects
=======
  @Post()
  @UseGuards(ThrottlerGuard)
  @Roles(Role.OrgOwner, Role.OrgAdmin) // Only admin roles can create
>>>>>>> origin/main
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.projectService.create(createProjectDto, organizationId);
  }

  @Get()
<<<<<<< HEAD
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findAll(
    @CurrentOrganizationId() organizationId: string,
    @Query('view') view?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
=======
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer)
  async findAll(
    @Query('view') view?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('organizationId') organizationId?: string
>>>>>>> origin/dev
  ) {
    const normalizedView =
      view?.toLowerCase() === 'detail' ? 'detail' : 'summary';

    // Parse pagination parameters with defaults
    const pageNum = Math.max(parseInt(page || '1') || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit || '20') || 20, 1), 100); // Max 100 items per page

    const filters = {
      status: status?.split(',').filter(Boolean),
      search: search?.trim(),
    };

    return this.projectService.findAll(normalizedView, organizationId);
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findOne(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.projectService.findOne(id, organizationId);
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can update
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.projectService.update(id, updateProjectDto, organizationId);
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner) // Only org owner can delete
  remove(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.projectService.remove(id, organizationId);
  }

  @Get(':id/stats')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  getProjectStats(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.projectService.getProjectStats(id, organizationId);
  }
}
