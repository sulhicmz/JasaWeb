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
@UseGuards(RolesGuard) // Use the roles guard
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only these roles can create projects
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.projectService.create(createProjectDto, organizationId);
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findAll(
    @CurrentOrganizationId() organizationId: string,
    @Query('view') view?: string
  ) {
    const normalizedView =
      view?.toLowerCase() === 'detail' ? 'detail' : 'summary';
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
