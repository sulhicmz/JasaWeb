import { Injectable, NotFoundException } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

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
    select: projectRelationsInclude,
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
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

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

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // First check if project exists
    await this.findOne(id);

    return this.multiTenantPrisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: string) {
    // First check if project exists
    await this.findOne(id);

    return this.multiTenantPrisma.project.delete({
      where: { id },
    });
  }

  // Business logic methods
  async findByOrganization(organizationId: string, view: ProjectViewMode = 'summary') {
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
            approvals: true,
            tasks: true,
          },
        },
        milestones: {
          where: { status: 'completed' },
          select: { id: true },
        },
        approvals: {
          where: { status: 'pending' },
          select: { id: true },
        },
        tasks: {
          where: { status: 'completed' },
          select: { id: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const milestoneCount = project._count.milestones;
    const completedMilestones = project.milestones.length;
    const fileCount = project._count.files;
    const pendingApprovals = project.approvals.length;
    const taskCount = project._count.tasks;
    const completedTasks = project.tasks.length;

    return {
      milestoneCount,
      completedMilestones,
      fileCount,
      pendingApprovals,
      taskCount,
      completedTasks,
      progress: milestoneCount > 0 ? Math.round((completedMilestones / milestoneCount) * 100) : 0,
    };
  }
}