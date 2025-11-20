import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { WorkflowAutomationService } from './workflow-automation.service';

export interface CreateProjectTemplateDto {
  name: string;
  description?: string;
  serviceType: 'school-website' | 'news-portal' | 'company-profile';
  settings?: Record<string, any>;
}

export interface UpdateProjectTemplateDto {
  name?: string;
  description?: string;
  serviceType?: 'school-website' | 'news-portal' | 'company-profile';
  isActive?: boolean;
  settings?: Record<string, any>;
}

export interface CreateMilestoneTemplateDto {
  projectTemplateId: string;
  title: string;
  description?: string;
  order: number;
  durationDays?: number;
  isRequired?: boolean;
  settings?: Record<string, any>;
}

export interface CreateTaskTemplateDto {
  milestoneTemplateId: string;
  title: string;
  description?: string;
  order: number;
  assigneeRole?: string;
  durationDays?: number;
  isRequired?: boolean;
  settings?: Record<string, any>;
}

@Injectable()
export class ProjectTemplateService {
  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly workflowAutomation: WorkflowAutomationService
  ) {}

  // Project Template CRUD
  async createProjectTemplate(createDto: CreateProjectTemplateDto) {
    return this.multiTenantPrisma.projectTemplate.create({
      data: {
        ...createDto,
        version: '1.0',
      },
      include: {
        milestoneTemplates: {
          include: {
            taskTemplates: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async findAllProjectTemplates() {
    return this.multiTenantPrisma.projectTemplate.findMany({
      where: {
        isActive: true,
      },
      include: {
        milestoneTemplates: {
          include: {
            taskTemplates: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findProjectTemplateById(id: string) {
    const template = await this.multiTenantPrisma.projectTemplate.findUnique({
      where: { id },
      include: {
        milestoneTemplates: {
          include: {
            taskTemplates: {
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Project template with ID ${id} not found`);
    }

    return template;
  }

  async findProjectTemplatesByServiceType(serviceType: string) {
    return this.multiTenantPrisma.projectTemplate.findMany({
      where: {
        serviceType,
        isActive: true,
      },
      include: {
        milestoneTemplates: {
          include: {
            taskTemplates: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async updateProjectTemplate(id: string, updateDto: UpdateProjectTemplateDto) {
    await this.findProjectTemplateById(id);

    return this.multiTenantPrisma.projectTemplate.update({
      where: { id },
      data: updateDto,
      include: {
        milestoneTemplates: {
          include: {
            taskTemplates: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async deleteProjectTemplate(id: string) {
    const template = await this.findProjectTemplateById(id);

    // Check if template is being used by projects
    if (template._count.projects > 0) {
      throw new BadRequestException(
        'Cannot delete template that is being used by projects'
      );
    }

    return this.multiTenantPrisma.projectTemplate.delete({
      where: { id },
    });
  }

  // Milestone Template CRUD
  async createMilestoneTemplate(createDto: CreateMilestoneTemplateDto) {
    // Validate project template exists
    await this.findProjectTemplateById(createDto.projectTemplateId);

    return this.multiTenantPrisma.milestoneTemplate.create({
      data: createDto,
      include: {
        taskTemplates: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async updateMilestoneTemplate(
    id: string,
    updateDto: Partial<CreateMilestoneTemplateDto>
  ) {
    const milestone = await this.multiTenantPrisma.milestoneTemplate.findUnique(
      {
        where: { id },
      }
    );

    if (!milestone) {
      throw new NotFoundException(`Milestone template with ID ${id} not found`);
    }

    return this.multiTenantPrisma.milestoneTemplate.update({
      where: { id },
      data: updateDto,
      include: {
        taskTemplates: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async deleteMilestoneTemplate(id: string) {
    const milestone = await this.multiTenantPrisma.milestoneTemplate.findUnique(
      {
        where: { id },
        include: {
          taskTemplates: true,
        },
      }
    );

    if (!milestone) {
      throw new NotFoundException(`Milestone template with ID ${id} not found`);
    }

    if (milestone.taskTemplates.length > 0) {
      throw new BadRequestException(
        'Cannot delete milestone template that has task templates'
      );
    }

    return this.multiTenantPrisma.milestoneTemplate.delete({
      where: { id },
    });
  }

  // Task Template CRUD
  async createTaskTemplate(createDto: CreateTaskTemplateDto) {
    // Validate milestone template exists
    const milestone = await this.multiTenantPrisma.milestoneTemplate.findUnique(
      {
        where: { id: createDto.milestoneTemplateId },
      }
    );

    if (!milestone) {
      throw new NotFoundException(
        `Milestone template with ID ${createDto.milestoneTemplateId} not found`
      );
    }

    return this.multiTenantPrisma.taskTemplate.create({
      data: createDto,
    });
  }

  async updateTaskTemplate(
    id: string,
    updateDto: Partial<CreateTaskTemplateDto>
  ) {
    const task = await this.multiTenantPrisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task template with ID ${id} not found`);
    }

    return this.multiTenantPrisma.taskTemplate.update({
      where: { id },
      data: updateDto,
    });
  }

  async deleteTaskTemplate(id: string) {
    const task = await this.multiTenantPrisma.taskTemplate.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task template with ID ${id} not found`);
    }

    return this.multiTenantPrisma.taskTemplate.delete({
      where: { id },
    });
  }

  // Template Application
  async applyTemplateToProject(
    templateId: string,
    projectData: {
      name: string;
      organizationId: string;
      startAt?: Date;
      dueAt?: Date;
    }
  ) {
    const template = await this.findProjectTemplateById(templateId);

    // Create project with template
    const project = await this.multiTenantPrisma.project.create({
      data: {
        ...projectData,
        projectTemplateId: templateId,
        status: 'draft',
      },
      include: {
        milestones: true,
        tasks: true,
      },
    });

    // Create milestones and tasks from template
    await this.createMilestonesAndTasksFromTemplate(
      project.id,
      template,
      projectData.startAt
    );

    // Trigger workflow automation
    await this.workflowAutomation.processProjectCreation(project.id, template);

    return this.multiTenantPrisma.project.findUnique({
      where: { id: project.id },
      include: {
        milestones: {
          include: {
            tasks: true,
          },
          orderBy: {
            dueAt: 'asc',
          },
        },
        projectTemplate: true,
      },
    });
  }

  private async createMilestonesAndTasksFromTemplate(
    projectId: string,
    template: any,
    startDate?: Date
  ) {
    const projectStart = startDate || new Date();
    let currentDate = new Date(projectStart);

    for (const milestoneTemplate of template.milestoneTemplates) {
      // Calculate milestone due date
      const milestoneDueAt = milestoneTemplate.durationDays
        ? new Date(
            currentDate.getTime() +
              milestoneTemplate.durationDays * 24 * 60 * 60 * 1000
          )
        : null;

      // Create milestone
      const milestone = await this.multiTenantPrisma.milestone.create({
        data: {
          projectId,
          title: milestoneTemplate.title,
          dueAt: milestoneDueAt,
          status: 'todo',
        },
      });

      // Create tasks for this milestone
      let taskCurrentDate = new Date(currentDate);
      for (const taskTemplate of milestoneTemplate.taskTemplates) {
        const taskDueAt = taskTemplate.durationDays
          ? new Date(
              taskCurrentDate.getTime() +
                taskTemplate.durationDays * 24 * 60 * 60 * 1000
            )
          : milestoneDueAt;

        await this.multiTenantPrisma.task.create({
          data: {
            projectId,
            title: taskTemplate.title,
            status: 'todo',
            dueAt: taskDueAt,
            labels: taskTemplate.assigneeRole || '',
          },
        });

        // Move to next task date
        if (taskTemplate.durationDays) {
          taskCurrentDate = new Date(
            taskCurrentDate.getTime() +
              taskTemplate.durationDays * 24 * 60 * 60 * 1000
          );
        }
      }

      // Move to next milestone date
      if (milestoneTemplate.durationDays) {
        currentDate = new Date(
          currentDate.getTime() +
            milestoneTemplate.durationDays * 24 * 60 * 60 * 1000
        );
      }
    }
  }

  // Analytics and Insights
  async getTemplateUsageStats() {
    const templates = await this.multiTenantPrisma.projectTemplate.findMany({
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      serviceType: template.serviceType,
      projectsCount: template._count.projects,
      isActive: template.isActive,
    }));
  }

  async getTemplateEffectivenessMetrics(templateId: string) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: {
        projectTemplateId: templateId,
      },
      include: {
        milestones: {
          select: {
            status: true,
            dueAt: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (projects.length === 0) {
      return {
        totalProjects: 0,
        averageCompletionTime: 0,
        onTimeCompletionRate: 0,
        averageTasksPerProject: 0,
      };
    }

    const completedProjects = projects.filter((p) => p.status === 'completed');
    const totalCompletionTime = completedProjects.reduce((sum, project) => {
      if (project.updatedAt && project.createdAt) {
        return (
          sum + (project.updatedAt.getTime() - project.createdAt.getTime())
        );
      }
      return sum;
    }, 0);

    const onTimeProjects = projects.filter((project) => {
      return project.milestones.every(
        (milestone) =>
          milestone.status === 'completed' ||
          !milestone.dueAt ||
          new Date(milestone.dueAt) >= new Date()
      );
    });

    const totalTasks = projects.reduce(
      (sum, project) => sum + project._count.tasks,
      0
    );

    return {
      totalProjects: projects.length,
      averageCompletionTime:
        completedProjects.length > 0
          ? Math.round(
              totalCompletionTime /
                completedProjects.length /
                (1000 * 60 * 60 * 24)
            ) // days
          : 0,
      onTimeCompletionRate: Math.round(
        (onTimeProjects.length / projects.length) * 100
      ),
      averageTasksPerProject: Math.round(totalTasks / projects.length),
    };
  }
}
