import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

export interface CreateMilestoneDto {
  projectId: string;
  title: string;
  dueAt?: Date;
  description?: string;
}

export interface UpdateMilestoneDto {
  title?: string;
  dueAt?: Date;
  status?: string; // todo, in-progress, completed, overdue
  description?: string;
}

@Injectable()
export class MilestoneService {
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  async create(createMilestoneDto: CreateMilestoneDto, organizationId: string) {
    // Validate that the project belongs to the organization
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id: createMilestoneDto.projectId },
    });

    if (!project) {
      throw new BadRequestException(
        'Project does not exist or does not belong to your organization'
      );
    }

    return await this.multiTenantPrisma.milestone.create({
      data: {
        ...createMilestoneDto,
        status:
          createMilestoneDto.dueAt &&
          new Date(createMilestoneDto.dueAt) < new Date()
            ? 'overdue'
            : 'todo',
      },
    });
  }

  async findAll(projectId?: string, organizationId: string = '') {
    if (projectId) {
      // Validate project exists and belongs to organization
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new BadRequestException(
          'Project does not exist or does not belong to your organization'
        );
      }

      return await this.multiTenantPrisma.milestone.findMany({
        where: { projectId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } else {
      return await this.multiTenantPrisma.milestone.findMany({
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
  }

  async findOne(id: string, organizationId: string) {
    const milestone = await this.multiTenantPrisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!milestone) {
      throw new BadRequestException(
        'Milestone not found or does not belong to your organization'
      );
    }

    return milestone;
  }

  async update(
    id: string,
    updateMilestoneDto: UpdateMilestoneDto,
    organizationId: string
  ) {
    // Check if milestone exists
    const existingMilestone = await this.multiTenantPrisma.milestone.findUnique(
      {
        where: { id },
      }
    );

    if (!existingMilestone) {
      throw new BadRequestException(
        'Milestone not found or does not belong to your organization'
      );
    }

    // Automatically update status based on due date if needed
    const updateData = { ...updateMilestoneDto };
    if (
      updateMilestoneDto.dueAt &&
      new Date(updateMilestoneDto.dueAt) < new Date() &&
      updateMilestoneDto.status !== 'completed'
    ) {
      updateData.status = 'overdue';
    }

    return await this.multiTenantPrisma.milestone.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, organizationId: string) {
    const milestone = await this.multiTenantPrisma.milestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      throw new BadRequestException(
        'Milestone not found or does not belong to your organization'
      );
    }

    return await this.multiTenantPrisma.milestone.delete({
      where: { id },
    });
  }

  // Business logic methods
  async findByStatus(status: string) {
    return this.multiTenantPrisma.milestone.findMany({
      where: { status },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOverdue() {
    return this.multiTenantPrisma.milestone.findMany({
      where: {
        status: 'overdue',
        dueAt: {
          lt: new Date(),
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getMilestoneStats(projectId?: string) {
    const whereClause = projectId ? { projectId } : {};

    const milestones = (await this.multiTenantPrisma.milestone.findMany({
      where: whereClause,
    })) as Array<{ status: string }>;

    const total = milestones.length;
    const todo = milestones.filter((m) => m.status === 'todo').length;
    const inProgress = milestones.filter(
      (m) => m.status === 'in-progress'
    ).length;
    const completed = milestones.filter((m) => m.status === 'completed').length;
    const overdue = milestones.filter((m) => m.status === 'overdue').length;

    return {
      total,
      todo,
      inProgress,
      completed,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}
