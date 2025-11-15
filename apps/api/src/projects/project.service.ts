import { Injectable, NotFoundException } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { NotificationService } from '../notifications/notification.service';

const projectRelationsInclude = {
  milestones: true,
  files: true,
  approvals: true,
  tasks: true,
  tickets: true,
  invoices: true,
} as const;

const projectSummarySelect = {
  id: true,
  name: true,
  status: true,
  startAt: true,
  dueAt: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  _count: {
    select: {
      milestones: true,
      files: true,
      approvals: true,
      tasks: true,
      tickets: true,
      invoices: true,
    },
  },
} as const;

type ProjectViewMode = 'summary' | 'detail';

type ProjectQueryArgs =
  | { select: typeof projectSummarySelect }
  | { include: typeof projectRelationsInclude };

const buildProjectQuery = (view: ProjectViewMode): ProjectQueryArgs =>
  view === 'detail'
    ? { include: projectRelationsInclude }
    : { select: projectSummarySelect };

export interface CreateProjectDto {
  name: string;
  status?: string;
  startAt?: Date;
  dueAt?: Date;
}

export interface UpdateProjectDto {
  name?: string;
  status?: string;
  startAt?: Date;
  dueAt?: Date;
}

@Injectable()
export class ProjectService {
  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly notificationService: NotificationService
  ) {}

  async create(createProjectDto: CreateProjectDto, organizationId: string) {
    return this.multiTenantPrisma.project.create({
      data: {
        ...createProjectDto,
        organizationId,
        status: createProjectDto.status || 'draft',
      },
    });
  }

  async findAll(view: ProjectViewMode = 'summary') {
    return this.multiTenantPrisma.project.findMany(buildProjectQuery(view));
  }

  async findOne(id: string) {
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id },
      include: projectRelationsInclude,
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId?: string,
    organizationId?: string
  ) {
    // First check if project exists
    const existingProject = await this.findOne(id);

    const updatedProject = await this.multiTenantPrisma.project.update({
      where: { id },
      data: updateProjectDto,
    });

    // Send notifications if user and organization are provided
    if (userId && organizationId) {
      // Get all organization members to notify
      const members = await this.multiTenantPrisma.membership.findMany({
        where: { organizationId },
      });

      // Get current user's name
      const currentUser = members.find((m) => m.userId === userId);
      const actorName = 'Someone'; // TODO: Get user name from user service

      // Notify all members except the current user
      for (const member of members) {
        if (member.userId !== userId) {
          await this.notificationService.notifyProjectUpdate(
            member.userId,
            organizationId,
            id,
            existingProject.name,
            actorName
          );
        }
      }
    }

    return updatedProject;
  }

  async remove(id: string) {
    // First check if project exists
    await this.findOne(id);

    return this.multiTenantPrisma.project.delete({
      where: { id },
    });
  }

  // Business logic methods
  async findByOrganization(
    organizationId: string,
    view: ProjectViewMode = 'summary'
  ) {
    return this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      ...buildProjectQuery(view),
    });
  }

  async findByStatus(status: string, view: ProjectViewMode = 'summary') {
    return this.multiTenantPrisma.project.findMany({
      where: { status },
      ...buildProjectQuery(view),
    });
  }

  async getProjectStats(id: string) {
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            milestones: true,
            files: true,
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const [completedMilestones, pendingApprovals, completedTasks] =
      await Promise.all([
        this.multiTenantPrisma.milestone.count({
          where: {
            projectId: id,
            status: 'completed',
          },
        }),
        this.multiTenantPrisma.approval.count({
          where: {
            projectId: id,
            status: 'pending',
          },
        }),
        this.multiTenantPrisma.task.count({
          where: {
            projectId: id,
            status: 'completed',
          },
        }),
      ]);

    const milestoneCount = (project as any)._count?.milestones || 0;
    const fileCount = (project as any)._count?.files || 0;
    const taskCount = (project as any)._count?.tasks || 0;

    return {
      milestoneCount,
      completedMilestones,
      fileCount,
      pendingApprovals,
      taskCount,
      completedTasks,
      progress:
        milestoneCount > 0
          ? Math.round((completedMilestones / milestoneCount) * 100)
          : 0,
    };
  }
}
