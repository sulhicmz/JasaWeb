import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

interface CreateApprovalDto {
  projectId: string;
  itemType: string; // page, content, design, feature, etc.
  itemId: string;
  requesterId: string; // This would typically come from the JWT token in a real implementation
}

interface ApproveRejectDto {
  approverId?: string; // This would typically come from the JWT token in a real implementation
  rejecterId?: string; // This would typically come from the JWT token in a real implementation
  note?: string;
}

@Controller('approvals')
@UseGuards(RolesGuard) // Use the roles guard
export class ApprovalController {
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Allow multiple roles to create approvals
  async create(
    @Body() createApprovalDto: CreateApprovalDto,
    @CurrentOrganizationId() organizationId: string,
  ) {
    // Validate that the project belongs to the organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: createApprovalDto.projectId },
    });

    if (!project) {
      throw new BadRequestException('Project does not exist or does not belong to your organization');
    }

    return await this.multiTenantPrisma.approval.create({
      data: {
        ...createApprovalDto,
        status: 'pending', // Set initial status
      },
    });
  }

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed to read
  async findAll(
    @CurrentOrganizationId() organizationId: string,
  ) {
    return await this.multiTenantPrisma.approval.findMany({
      where: {
        project: {
          organizationId: organizationId, // Filter by organization ID
        },
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date
      },
    });
  }

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member) // Multiple roles allowed to read
  async findOne(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
    const approval = await this.multiTenantPrisma.approval.findUnique({
      where: { 
        id,
        project: {
          organizationId: organizationId, // Filter by organization ID
        },
      },
    });

    if (!approval) {
      throw new BadRequestException('Approval not found or does not belong to your organization');
    }

    return approval;
  }

  @UseGuards(ThrottlerGuard)
  @Post(':id/approve')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer) // Only certain roles can approve
  async approve(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
    @Body() approveDto: ApproveRejectDto,
  ) {
    // Verify the approval exists and belongs to the organization
    const approval = await this.multiTenantPrisma.approval.findUnique({
      where: {
        id,
        project: {
          organizationId: organizationId, // Filter by organization ID
        },
      },
    });

    if (!approval) {
      throw new BadRequestException('Approval not found or does not belong to your organization');
    }

    // Check if the approval is already processed
    if (approval.status !== 'pending') {
      throw new BadRequestException('Approval has already been processed');
    }

    return await this.multiTenantPrisma.approval.update({
      where: { id },
      data: {
        status: 'approved',
        decidedById: approveDto.approverId,
        decidedAt: new Date(),
        note: approveDto.note,
      },
    });
  }

  @UseGuards(ThrottlerGuard)
  @Post(':id/reject')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer) // Only certain roles can reject
  async reject(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
    @Body() rejectDto: ApproveRejectDto,
  ) {
    // Verify the approval exists and belongs to the organization
    const approval = await this.multiTenantPrisma.approval.findUnique({
      where: {
        id,
        project: {
          organizationId: organizationId, // Filter by organization ID
        },
      },
    });

    if (!approval) {
      throw new BadRequestException('Approval not found or does not belong to your organization');
    }

    // Check if the approval is already processed
    if (approval.status !== 'pending') {
      throw new BadRequestException('Approval has already been processed');
    }

    return await this.multiTenantPrisma.approval.update({
      where: { id },
      data: {
        status: 'rejected',
        decidedById: rejectDto.rejecterId,
        decidedAt: new Date(),
        note: rejectDto.note,
      },
    });
  }
}