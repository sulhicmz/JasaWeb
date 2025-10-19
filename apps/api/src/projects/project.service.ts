import { Injectable, NotFoundException } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

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

  async findAll() {
    return this.multiTenantPrisma.project.findMany({
      include: {
        milestones: true,
        files: true,
        approvals: true,
        tasks: true,
        tickets: true,
        invoices: true,
      },
    });
  }

  async findOne(id: string) {
    const project = await this.multiTenantPrisma.project.findUnique({
      where: { id },
      include: {
        milestones: true,
        files: true,
        approvals: true,
        tasks: true,
        tickets: true,
        invoices: true,
      },
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
  async findByOrganization(organizationId: string) {
    return this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      include: {
        milestones: true,
        files: true,
        approvals: true,
        tasks: true,
        tickets: true,
        invoices: true,
      },
    });
  }

  async findByStatus(status: string) {
    return this.multiTenantPrisma.project.findMany({
      where: { status },
      include: {
        milestones: true,
        files: true,
        approvals: true,
        tasks: true,
        tickets: true,
        invoices: true,
      },
    });
  }

  async getProjectStats(id: string) {
    const project = await this.findOne(id);

    const milestoneCount = project.milestones.length;
    const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
    const fileCount = project.files.length;
    const pendingApprovals = project.approvals.filter(a => a.status === 'pending').length;
    const taskCount = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'completed').length;

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