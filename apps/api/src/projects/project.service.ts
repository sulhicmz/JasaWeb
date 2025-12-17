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

export interface PaginationOptions {
  page: number;
  limit: number;
  filters?: {
    status?: string[];
    search?: string;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class ProjectService {
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  async create(createProjectDto: CreateProjectDto, organizationId: string) {
    return this.multiTenantPrisma.project.create({
      data: {
        ...createProjectDto,
        status: createProjectDto.status || 'draft',
        organizationId,
      },
    });
  }

  async findAll(
    view: ProjectViewMode = 'summary',
    organizationId?: string,
    options?: PaginationOptions
  ) {
    const { page = 1, limit = 20, filters = {} } = options || {};

    // Build where clause
    const whereClause: Record<string, unknown> = organizationId
      ? { organizationId }
      : {};

    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }

    if (filters.search) {
      whereClause.name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Get total count for pagination
    const total = await this.multiTenantPrisma.project.count({
      where: whereClause,
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get paginated data
    const data = await this.multiTenantPrisma.project.findMany({
      ...buildProjectQuery(view),
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, organizationId?: string) {
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id },
      include: projectRelationsInclude,
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (organizationId && project.organizationId !== organizationId) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    organizationId?: string
  ) {
    // First check if project exists and belongs to organization
    await this.findOne(id, organizationId);

    return this.multiTenantPrisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: string, organizationId?: string) {
    // First check if project exists and belongs to organization
    await this.findOne(id, organizationId);

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

  async getProjectStats(id: string, organizationId?: string) {
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        organizationId: true,
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

    if (organizationId && project.organizationId !== organizationId) {
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
