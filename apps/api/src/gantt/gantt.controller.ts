import {
  Controller,
  Get,
  UseGuards,
  Query,
  Post,
  Body,
  Param,
  Patch,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

interface GanttProject {
  id: string;
  name: string;
  startAt: Date;
  dueAt: Date;
  status: string;
  progress: number;
  milestones: GanttMilestone[];
  dependencies?: string[];
  assignee?: string;
  priority?: string;
}

interface GanttMilestone {
  id: string;
  title: string;
  dueAt: Date;
  status: string;
  completedAt?: Date;
  projectId: string;
  progress?: number;
  assignees?: any[];
  dependencies?: any[];
}

@Controller('gantt')
@UseGuards(RolesGuard, ThrottlerGuard)
export class GanttController {
  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly dashboardGateway: DashboardGateway
  ) {}

  @Get('projects')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getGanttProjects(
    @CurrentOrganizationId() organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string
  ): Promise<GanttProject[]> {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    const projects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        ...(status && { status }),
        OR: [
          {
            AND: [{ startAt: { lte: end } }, { dueAt: { gte: start } }],
          },
          {
            AND: [{ createdAt: { lte: end } }, { dueAt: { gte: start } }],
          },
        ],
      },
      include: {
        milestones: {
          where: {
            dueAt: { gte: start, lte: end },
          },
          include: {
            dependencies: {
              include: {
                dependsOn: true,
              },
            },
          },
          orderBy: { dueAt: 'asc' },
        },
        _count: {
          select: {
            milestones: true,
            tickets: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    // Transform to Gantt format
    return projects.map((project: any) => {
      const totalMilestones = project.milestones?.length || 0;
      const completedMilestones =
        project.milestones?.filter((m: any) => m.status === 'completed')
          .length || 0;
      const progress =
        totalMilestones > 0
          ? Math.round((completedMilestones / totalMilestones) * 100)
          : 0;

      return {
        id: project.id,
        name: project.name,
        startAt: project.startAt || project.createdAt,
        dueAt: project.dueAt,
        status: project.status,
        progress,
        milestones:
          project.milestones?.map((milestone: any) => ({
            id: milestone.id,
            title: milestone.title,
            dueAt: milestone.dueAt,
            status: milestone.status,
            completedAt: milestone.completedAt,
            projectId: milestone.projectId,
            progress: this.calculateMilestoneProgress(milestone),
            assignees: [], // Would be populated from user assignments
            dependencies:
              milestone.dependencies?.map((dep: any) => ({
                id: dep.id,
                title: dep.dependsOn.title,
              })) || [],
          })) || [],
        assignee: 'Unassigned', // Would be populated from project assignments
        priority: this.calculateProjectPriority(project),
      };
    });
  }

  @Get('milestones')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getGanttMilestones(
    @CurrentOrganizationId() organizationId: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<GanttMilestone[]> {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      organizationId,
      dueAt: { gte: start, lte: end },
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (status) {
      whereClause.status = status;
    }

    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        dependencies: {
          include: {
            dependsOn: true,
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });

    return milestones.map((milestone: any) => ({
      id: milestone.id,
      title: milestone.title,
      dueAt: milestone.dueAt,
      status: milestone.status,
      completedAt: milestone.completedAt,
      projectId: milestone.projectId,
      progress: this.calculateMilestoneProgress(milestone),
      assignees: [], // Would be populated from user assignments
      dependencies:
        milestone.dependencies?.map((dep: any) => ({
          id: dep.id,
          title: dep.dependsOn.title,
        })) || [],
    }));
  }

  @Patch('milestones/:id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer)
  async updateMilestone(
    @Param('id') id: string,
    @Body()
    updateData: {
      dueAt?: Date;
      status?: string;
      title?: string;
      progress?: number;
    },
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() userId: string
  ) {
    try {
      // Verify milestone belongs to organization
      const existingMilestone =
        await this.multiTenantPrisma.milestone.findFirst({
          where: {
            id,
            organizationId,
          },
        });

      if (!existingMilestone) {
        throw new Error('Milestone not found');
      }

      // Update milestone
      const updatedMilestone = await this.multiTenantPrisma.milestone.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
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

      // Broadcast update to all connected clients
      await this.dashboardGateway.broadcastDashboardUpdate({
        type: 'milestone',
        data: {
          action: 'updated',
          milestone: updatedMilestone,
          updatedBy: userId,
        },
        timestamp: new Date(),
        organizationId,
      });

      return {
        success: true,
        milestone: updatedMilestone,
      };
    } catch (error) {
      throw new Error(
        `Failed to update milestone: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @Post('milestones/:id/complete')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer)
  async completeMilestone(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() userId: string
  ) {
    try {
      // Verify milestone belongs to organization
      const existingMilestone =
        await this.multiTenantPrisma.milestone.findFirst({
          where: {
            id,
            organizationId,
          },
        });

      if (!existingMilestone) {
        throw new Error('Milestone not found');
      }

      // Update milestone as completed
      const completedMilestone = await this.multiTenantPrisma.milestone.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          progress: 100,
          updatedAt: new Date(),
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

      // Create audit log
      await this.multiTenantPrisma.auditLog.create({
        data: {
          actorId: userId,
          organizationId,
          action: 'MILESTONE_COMPLETED',
          target: 'milestone',
          targetId: id,
          meta: {
            milestoneTitle: existingMilestone.title,
            projectId: existingMilestone.projectId,
            notes: body.notes,
          },
        },
      });

      // Broadcast update to all connected clients
      await this.dashboardGateway.broadcastDashboardUpdate({
        type: 'milestone',
        data: {
          action: 'completed',
          milestone: completedMilestone,
          completedBy: userId,
          notes: body.notes,
        },
        timestamp: new Date(),
        organizationId,
      });

      return {
        success: true,
        milestone: completedMilestone,
      };
    } catch (error) {
      throw new Error(
        `Failed to complete milestone: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  @Get('resource-allocation')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer)
  async getResourceAllocation(
    @CurrentOrganizationId() organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Get active projects in the date range
    const projects = await this.multiTenantPrisma.project.findMany({
      where: {
        organizationId,
        status: { in: ['active', 'in-progress'] },
        AND: [{ startAt: { lte: end } }, { dueAt: { gte: start } }],
      },
      include: {
        milestones: {
          where: {
            dueAt: { gte: start, lte: end },
          },
          orderBy: { dueAt: 'asc' },
        },
      },
    });

    // Mock team member data (in real implementation, this would come from users table)
    const teamMembers = [
      {
        id: '1',
        name: 'John Doe',
        role: 'Developer',
        capacity: 40,
        skills: ['React', 'Node.js'],
      },
      {
        id: '2',
        name: 'Jane Smith',
        role: 'Designer',
        capacity: 40,
        skills: ['UI/UX', 'Figma'],
      },
      {
        id: '3',
        name: 'Mike Johnson',
        role: 'Project Manager',
        capacity: 40,
        skills: ['Agile', 'Scrum'],
      },
      {
        id: '4',
        name: 'Sarah Wilson',
        role: 'Developer',
        capacity: 40,
        skills: ['Python', 'Django'],
      },
      {
        id: '5',
        name: 'Tom Brown',
        role: 'QA Engineer',
        capacity: 40,
        skills: ['Testing', 'Automation'],
      },
    ];

    // Calculate resource allocation
    const allocations = projects.map((project) => ({
      projectId: project.id,
      projectName: project.name,
      requiredHours: this.estimateProjectHours(project),
      allocatedMembers: teamMembers.slice(0, Math.floor(Math.random() * 3) + 1),
      utilization: Math.floor(Math.random() * 40) + 60, // 60-100% utilization
    }));

    // Identify conflicts
    const conflicts = this.identifyResourceConflicts(allocations, teamMembers);

    return {
      teamMembers,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        startAt: p.startAt,
        dueAt: p.dueAt,
        milestoneCount: 0, // Will be populated separately
      })),
      allocations,
      conflicts,
      summary: {
        totalTeamMembers: teamMembers.length,
        totalProjects: projects.length,
        averageUtilization: Math.round(
          allocations.reduce((sum, a) => sum + a.utilization, 0) /
            allocations.length
        ),
        conflictCount: conflicts.length,
      },
    };
  }

  private calculateMilestoneProgress(milestone: any): number {
    // In a real implementation, this would be based on tasks completion
    if (milestone.status === 'completed') return 100;
    if (milestone.status === 'in-progress')
      return Math.floor(Math.random() * 50) + 25;
    return 0;
  }

  private calculateProjectPriority(project: any): string {
    // Calculate priority based on due date, client importance, etc.
    const daysUntilDue = project.dueAt
      ? Math.ceil(
          (new Date(project.dueAt).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : Infinity;

    if (daysUntilDue < 7) return 'critical';
    if (daysUntilDue < 14) return 'high';
    if (daysUntilDue < 30) return 'medium';
    return 'low';
  }

  private estimateProjectHours(project: any): number {
    // Estimate hours based on milestone count and complexity
    const baseHoursPerMilestone = 40;
    return (project.milestones?.length || 1) * baseHoursPerMilestone;
  }

  private identifyResourceConflicts(
    allocations: any[],
    teamMembers: any[]
  ): any[] {
    const conflicts: any[] = [];

    // Check for over-allocated team members
    teamMembers.forEach((member) => {
      const memberAllocations = allocations.filter((a) =>
        a.allocatedMembers.some((m: any) => m.id === member.id)
      );

      const totalHours = memberAllocations.reduce(
        (sum, a) => sum + a.requiredHours,
        0
      );
      const utilization = (totalHours / (member.capacity * 4)) * 100; // 4 weeks in a month

      if (utilization > 100) {
        conflicts.push({
          type: 'over_allocation',
          memberId: member.id,
          memberName: member.name,
          utilization: Math.round(utilization),
          projects: memberAllocations.map((a) => a.projectName),
        });
      }
    });

    // Check for overlapping critical projects
    const criticalProjects = allocations.filter((a) => a.utilization > 90);
    if (criticalProjects.length > 2) {
      conflicts.push({
        type: 'critical_overload',
        message: 'Too many high-priority projects running simultaneously',
        projects: criticalProjects.map((a) => a.projectName),
      });
    }

    return conflicts;
  }
}
