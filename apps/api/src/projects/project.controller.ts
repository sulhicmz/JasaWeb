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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ErrorResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(RolesGuard) // Use the roles guard
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a new project within the current organization',
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'proj_123' },
        name: { type: 'string', example: 'Website Redesign' },
        status: { type: 'string', example: 'active' },
        organizationId: { type: 'string', example: 'org_123' },
        createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: CreateProjectDto })
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only these roles can create projects
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentOrganizationId() organizationId: string
  ) {
    return this.projectService.create(createProjectDto, organizationId);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all projects',
    description:
      'Retrieves all projects for the current organization. Supports summary and detail views.',
  })
  @ApiQuery({
    name: 'view',
    required: false,
    description: 'View mode - summary or detail',
    enum: ['summary', 'detail'],
    example: 'summary',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'proj_123' },
          name: { type: 'string', example: 'Website Redesign' },
          status: { type: 'string', example: 'active' },
          _count: {
            type: 'object',
            properties: {
              milestones: { type: 'number', example: 5 },
              files: { type: 'number', example: 12 },
              approvals: { type: 'number', example: 3 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findAll(@Query('view') view?: string) {
    const normalizedView =
      view?.toLowerCase() === 'detail' ? 'detail' : 'summary';
    return this.projectService.findAll(normalizedView);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get project by ID',
    description: 'Retrieves a specific project by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
    example: 'proj_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'proj_123' },
        name: { type: 'string', example: 'Website Redesign' },
        status: { type: 'string', example: 'active' },
        startAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        dueAt: { type: 'string', example: '2024-12-31T00:00:00.000Z' },
        organizationId: { type: 'string', example: 'org_123' },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'milestone_123' },
              title: { type: 'string', example: 'Design Phase' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
    type: ErrorResponseDto,
  })
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update project',
    description: 'Updates an existing project with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
    example: 'proj_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'proj_123' },
        name: { type: 'string', example: 'Website Redesign v2' },
        status: { type: 'string', example: 'completed' },
        updatedAt: { type: 'string', example: '2024-01-15T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: UpdateProjectDto })
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can update
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(id, updateProjectDto);
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete project',
    description: 'Permanently deletes a project and all associated data',
  })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
    example: 'proj_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Project deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Project deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions (Org Owner only)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
    type: ErrorResponseDto,
  })
  @Roles(Role.OrgOwner) // Only org owner can delete
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}
