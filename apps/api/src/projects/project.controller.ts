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
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('projects')
@UseGuards(RolesGuard) // Use the roles guard
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @Roles(Role.OrgOwner, Role.OrgAdmin) // Only admin roles can create
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.projectService.create(createProjectDto, organizationId);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer)
  async findAll(
    @Query('view') view?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('organizationId') organizationId?: string
  ) {
    const normalizedView =
      view?.toLowerCase() === 'detail' ? 'detail' : 'summary';

    // Parse pagination parameters with defaults (currently unused but ready for future pagination)
    Math.max(parseInt(page || '1') || 1, 1);
    Math.min(Math.max(parseInt(limit || '20') || 20, 1), 100); // Max 100 items per page

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
