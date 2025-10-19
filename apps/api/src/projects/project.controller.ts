import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectService, CreateProjectDto, UpdateProjectDto } from './project.service';
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
  create(@Body() createProjectDto: CreateProjectDto, @CurrentOrganizationId() organizationId: string) {
    return this.projectService.create(createProjectDto, organizationId);
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can update
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(id, updateProjectDto);
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner) // Only org owner can delete
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}