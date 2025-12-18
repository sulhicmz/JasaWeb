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
  UseInterceptors,
  SetMetadata,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import type { CreateProjectDto, UpdateProjectDto } from './project.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  CacheInterceptor,
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '../common/interceptors/cache.interceptor';

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
  @UseInterceptors(CacheInterceptor)
  @SetMetadata(CACHE_KEY_METADATA, 'projects:list')
  @SetMetadata(CACHE_TTL_METADATA, 300) // 5 minutes
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findAll(
    @CurrentOrganizationId() organizationId: string,
    @Query('view') view?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const normalizedView =
      view?.toLowerCase() === 'detail' ? 'detail' : 'summary';

    // Parse pagination parameters with defaults
    const pageNum = Math.max(parseInt(page || '1') || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit || '20') || 20, 1), 100); // Max 100 items per page

    return this.projectService.findAll(normalizedView, organizationId);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @SetMetadata(CACHE_KEY_METADATA, 'project:detail')
  @SetMetadata(CACHE_TTL_METADATA, 600) // 10 minutes
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
