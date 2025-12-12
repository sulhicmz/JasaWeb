import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';

interface GanttTask {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dependencies?: string[];
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'milestone' | 'task' | 'deliverable';
  projectId: string;
  projectName: string;
}

@Controller('dashboard')
@UseGuards(RolesGuard)
export class GanttController {
  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  @Get('gantt-tasks')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getGanttTasks(
    @CurrentOrganizationId() organizationId: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string
  ): Promise<GanttTask[]> {
    // Build where clause
    const whereClause: any = { organizationId };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Fetch projects with their milestones and tasks
    const projects = (await this.multiTenantPrisma.project.findMany({
      where: whereClause,
      include: {
        milestones: {
          include: {
            dependencies: {
              include: {
                dependentOn: true,
              },
            },
          },
          orderBy: {
            dueAt: 'asc',
          },
        },
        tickets: {
          where: {
            type: 'task', // Only include task-type tickets in Gantt
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            milestones: true,
            tickets: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })) as any[];

    const ganttTasks: GanttTask[] = [];

    for (const project of projects) {
      // Add project milestones as Gantt tasks
      for (const milestone of project.milestones) {
        // Calculate progress based on status
        let progress = 0;
        let taskStatus: GanttTask['status'] = 'pending';

        switch (milestone.status) {
          case 'completed':
            progress = 100;
            taskStatus = 'completed';
            break;
          case 'in-progress':
            progress = 50;
            taskStatus = 'in-progress';
            break;
          case 'overdue':
            progress = 25;
            taskStatus = 'overdue';
            break;
          default:
            progress = 0;
            taskStatus = 'pending';
        }

        // Check if milestone is overdue
        if (
          milestone.dueAt &&
          new Date(milestone.dueAt) < new Date() &&
          milestone.status !== 'completed'
        ) {
          taskStatus = 'overdue';
        }

        const ganttTask: GanttTask = {
          id: `milestone-${milestone.id}`,
          title: milestone.title,
          startDate: milestone.createdAt.toISOString().split('T')[0],
          endDate: (milestone.dueAt || milestone.createdAt)
            .toISOString()
            .split('T')[0],
          progress,
          status: taskStatus,
          dependencies:
            milestone.dependencies?.map(
              (dep: any) => `milestone-${dep.dependentOn.id}`
            ) || [],
          assignee: milestone.assignedTo || undefined,
          priority: (milestone.priority as GanttTask['priority']) || 'medium',
          type: 'milestone',
          projectId: project.id,
          projectName: project.name,
        };

        // Apply filters
        if (status && ganttTask.status !== status) continue;
        if (priority && ganttTask.priority !== priority) continue;

        ganttTasks.push(ganttTask);
      }

      // Add project tickets as Gantt tasks
      for (const ticket of project.tickets) {
        // Calculate progress based on ticket status
        let progress = 0;
        let taskStatus: GanttTask['status'] = 'pending';

        switch (ticket.status) {
          case 'resolved':
          case 'closed':
            progress = 100;
            taskStatus = 'completed';
            break;
          case 'in-progress':
            progress = 60;
            taskStatus = 'in-progress';
            break;
          case 'open':
            progress = 20;
            taskStatus = 'pending';
            break;
          default:
            progress = 0;
            taskStatus = 'pending';
        }

        // Check if ticket is overdue (based on priority SLA)
        if (
          ticket.dueAt &&
          new Date(ticket.dueAt) < new Date() &&
          ticket.status !== 'closed'
        ) {
          taskStatus = 'overdue';
        }

        const ganttTask: GanttTask = {
          id: `ticket-${ticket.id}`,
          title: `${ticket.type}: ${ticket.subject}`,
          startDate: ticket.createdAt.toISOString().split('T')[0],
          endDate: (
            ticket.dueAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          )
            .toISOString()
            .split('T')[0],
          progress,
          status: taskStatus,
          assignee: ticket.assigneeId || undefined,
          priority: (ticket.priority as GanttTask['priority']) || 'medium',
          type: 'task',
          projectId: project.id,
          projectName: project.name,
        };

        // Apply filters
        if (status && ganttTask.status !== status) continue;
        if (priority && ganttTask.priority !== priority) continue;

        ganttTasks.push(ganttTask);
      }

      // Add project deliverables based on milestones
      const deliverables = this.generateProjectDeliverables(project as any);
      for (const deliverable of deliverables) {
        // Apply filters
        if (status && deliverable.status !== status) continue;
        if (priority && deliverable.priority !== priority) continue;

        ganttTasks.push(deliverable);
      }
    }

    // Sort tasks by start date
    return ganttTasks.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  private generateProjectDeliverables(project: any): GanttTask[] {
    const deliverables: GanttTask[] = [];

    // Generate standard deliverables based on project type and milestones
    const milestoneCount = project._count.milestones;

    if (milestoneCount > 0) {
      // Design deliverable
      deliverables.push({
        id: `deliverable-design-${project.id}`,
        title: 'Design Assets & Mockups',
        startDate: project.createdAt.toISOString().split('T')[0] as string,
        endDate: new Date(
          project.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split('T')[0] as string,
        progress:
          project.status === 'completed'
            ? 100
            : project.status === 'in-progress'
              ? 70
              : 30,
        status:
          project.status === 'completed'
            ? 'completed'
            : project.status === 'in-progress'
              ? 'in-progress'
              : 'pending',
        priority: 'high',
        type: 'deliverable',
        projectId: project.id,
        projectName: project.name,
      });

      // Development deliverable
      deliverables.push({
        id: `deliverable-dev-${project.id}`,
        title: 'Functional Website',
        startDate: new Date(
          project.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split('T')[0] as string,
        endDate: project.dueAt
          ? (new Date(project.dueAt).toISOString().split('T')[0] as string)
          : (new Date(project.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0] as string),
        progress:
          project.status === 'completed'
            ? 100
            : project.status === 'in-progress'
              ? 60
              : 20,
        status:
          project.status === 'completed'
            ? 'completed'
            : project.status === 'in-progress'
              ? 'in-progress'
              : 'pending',
        priority: 'critical',
        type: 'deliverable',
        projectId: project.id,
        projectName: project.name,
      });

      // Documentation deliverable
      deliverables.push({
        id: `deliverable-docs-${project.id}`,
        title: 'Project Documentation',
        startDate: new Date(
          project.createdAt.getTime() + 20 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split('T')[0] as string,
        endDate: project.dueAt
          ? (new Date(project.dueAt).toISOString().split('T')[0] as string)
          : (new Date(project.createdAt.getTime() + 35 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0] as string),
        progress:
          project.status === 'completed'
            ? 100
            : project.status === 'in-progress'
              ? 40
              : 10,
        status:
          project.status === 'completed'
            ? 'completed'
            : project.status === 'in-progress'
              ? 'in-progress'
              : 'pending',
        priority: 'medium',
        type: 'deliverable',
        projectId: project.id,
        projectName: project.name,
      });
    }

    return deliverables;
  }

  @Get('gantt-summary')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getGanttSummary(@CurrentOrganizationId() organizationId: string) {
    const tasks = await this.getGanttTasks(organizationId);

    const summary = {
      totalTasks: tasks.length,
      tasksByStatus: {
        pending: tasks.filter((t) => t.status === 'pending').length,
        inProgress: tasks.filter((t) => t.status === 'in-progress').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        overdue: tasks.filter((t) => t.status === 'overdue').length,
      },
      tasksByPriority: {
        critical: tasks.filter((t) => t.priority === 'critical').length,
        high: tasks.filter((t) => t.priority === 'high').length,
        medium: tasks.filter((t) => t.priority === 'medium').length,
        low: tasks.filter((t) => t.priority === 'low').length,
      },
      tasksByType: {
        milestone: tasks.filter((t) => t.type === 'milestone').length,
        task: tasks.filter((t) => t.type === 'task').length,
        deliverable: tasks.filter((t) => t.type === 'deliverable').length,
      },
      averageProgress: Math.round(
        tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
      ),
      upcomingDeadlines: tasks
        .filter(
          (task) =>
            new Date(task.endDate) >= new Date() &&
            new Date(task.endDate) <=
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
        .sort(
          (a, b) =>
            new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        )
        .slice(0, 5)
        .map((task) => ({
          id: task.id,
          title: task.title,
          projectName: task.projectName,
          dueDate: task.endDate,
          priority: task.priority,
          status: task.status,
        })),
    };

    return summary;
  }
}
