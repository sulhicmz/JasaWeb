import { Injectable, NotFoundException } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

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

// Interfaces removed - now using proper DTO classes from dto directory

@Injectable()
export class ProjectService {
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    return this.multiTenantPrisma.project.create({
      data: {
        ...createProjectDto,
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

    const projectWithCount = project as typeof project & {
      _count?: {
        milestones?: number;
        files?: number;
        tasks?: number;
      };
    };
    const milestoneCount = projectWithCount._count?.milestones || 0;
    const fileCount = projectWithCount._count?.files || 0;
    const taskCount = projectWithCount._count?.tasks || 0;

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
