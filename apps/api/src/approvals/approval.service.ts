import { Injectable, BadRequestException } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

@Injectable()
export class ApprovalService {
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  async createApproval(
    organizationId: string,
    projectId: string,
    itemType: string,
    itemId: string,
    requesterId: string,
  ): Promise<any> {
    // Verify the project belongs to the organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new BadRequestException('Project not found or does not belong to your organization');
    }

// Create the approval
    return await this.multiTenantPrisma.approval.create({
      data: {
        projectId,
        itemType,
        itemId,
        status: 'pending',
      },
    });
  }

  async findApprovalsForProject(projectId: string, organizationId: string): Promise<any[]> {
    // Verify the project belongs to the organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new BadRequestException('Project not found or does not belong to your organization');
    }

    return await this.multiTenantPrisma.approval.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approveApproval(
    approvalId: string,
    approverId: string,
    organizationId: string,
    note?: string,
  ): Promise<any> {
    // Verify the approval exists and belongs to the organization
    const approval = await this.multiTenantPrisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new BadRequestException('Approval not found');
    }

    // Check if the approval is already processed
    if (approval.status !== 'pending') {
      throw new BadRequestException('Approval has already been processed');
    }

    // Update the approval
    return await this.multiTenantPrisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'approved',
        decidedById: approverId,
        decidedAt: new Date(),
        note,
      },
    });
  }

  async rejectApproval(
    approvalId: string,
    rejecterId: string,
    organizationId: string,
    note?: string,
  ): Promise<any> {
    // Verify the approval exists and belongs to the organization
    const approval = await this.multiTenantPrisma.approval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new BadRequestException('Approval not found');
    }

    // Check if the approval is already processed
    if (approval.status !== 'pending') {
      throw new BadRequestException('Approval has already been processed');
    }

    // Update the approval
    return await this.multiTenantPrisma.approval.update({
      where: { id: approvalId },
      data: {
        status: 'rejected',
        decidedById: rejecterId,
        decidedAt: new Date(),
        note,
      },
    });
  }
}