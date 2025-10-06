import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

// Define DTO for milestone creation/update
interface CreateMilestoneDto {
  projectId: string;
  title: string;
  dueAt?: Date;
  description?: string;
}

interface UpdateMilestoneDto {
  title?: string;
  dueAt?: Date;
  status?: string; // todo, in-progress, completed, overdue
  description?: string;
}

@Controller('milestones')
@UseGuards(RolesGuard) // Use the roles guard
export class MilestoneController {
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Allow multiple roles to create
  async create(
    @Body() createMilestoneDto: CreateMilestoneDto,
    @CurrentOrganizationId() organizationId: string,
  ) {
    // Validate that the project belongs to the organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: createMilestoneDto.projectId },
    });

    if (!project) {
      throw new BadRequestException('Project does not exist or does not belong to your organization');
    }

    return await this.multiTenantPrisma.milestone.create({
      data: {
        ...createMilestoneDto,
        status: createMilestoneDto.dueAt && new Date(createMilestoneDto.dueAt) < new Date() ? 'overdue' : 'todo', // Set initial status
      },
    });
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed to read
  async findAll(
    @Query('projectId') projectId?: string,
    @CurrentOrganizationId() organizationId: string = '',
  ) {
    // If projectId is provided, fetch milestones for that project
    // Otherwise fetch all milestones for the organization
    if (projectId) {
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new BadRequestException('Project does not exist or does not belong to your organization');
      }

      return await this.multiTenantPrisma.milestone.findMany({
        where: {
          projectId: projectId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });
    } else {
      return await this.multiTenantPrisma.milestone.findMany({
        include: {
          project: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });
    }
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed to read
  async findOne(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
    const milestone = await this.multiTenantPrisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!milestone) {
      throw new BadRequestException('Milestone not found or does not belong to your organization');
    }

    return milestone;
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Allow multiple roles to update
  async update(
    @Param('id') id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
    @CurrentOrganizationId() organizationId: string,
  ) {
    // Check if milestone exists and belongs to the organization (through the project relationship)
    const existingMilestone = await this.multiTenantPrisma.milestone.findUnique({
      where: { id },
    });

    if (!existingMilestone) {
      throw new BadRequestException('Milestone not found or does not belong to your organization');
    }

    // Update the milestone
    return await this.multiTenantPrisma.milestone.update({
      where: { id },
      data: {
        ...updateMilestoneDto,
        // Automatically update status based on due date if needed
        ...(updateMilestoneDto.dueAt && new Date(updateMilestoneDto.dueAt) < new Date() && 
          updateMilestoneDto.status !== 'completed' && { status: 'overdue' }),
      },
    });
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin) // Only org owners and admins can delete
  async remove(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
    const milestone = await this.multiTenantPrisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new BadRequestException('Milestone not found or does not belong to your organization');
    }

    return await this.multiTenantPrisma.milestone.delete({
      where: { id },
    });
  }
}