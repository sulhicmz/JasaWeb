import { Injectable, Logger } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';

export interface CreateWorkflowRuleDto {
  name: string;
  description?: string;
  trigger: string;
  condition?: Record<string, any>;
  action: string;
  parameters?: Record<string, any>;
  isActive?: boolean;
}

export interface WorkflowContext {
  projectId?: string;
  milestoneId?: string;
  taskId?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class WorkflowAutomationService {
  private readonly logger = new Logger(WorkflowAutomationService.name);

  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {}

  // Workflow Rule CRUD
  async createWorkflowRule(createDto: CreateWorkflowRuleDto) {
    return this.multiTenantPrisma.workflowRule.create({
      data: {
        ...createDto,
        isActive: createDto.isActive ?? true,
      },
    });
  }

  async findAllWorkflowRules() {
    return this.multiTenantPrisma.workflowRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findWorkflowRuleById(id: string) {
    const rule = await this.multiTenantPrisma.workflowRule.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new Error(`Workflow rule with ID ${id} not found`);
    }

    return rule;
  }

  async updateWorkflowRule(
    id: string,
    updateDto: Partial<CreateWorkflowRuleDto>
  ) {
    await this.findWorkflowRuleById(id);

    return this.multiTenantPrisma.workflowRule.update({
      where: { id },
      data: updateDto,
    });
  }

  async deleteWorkflowRule(id: string) {
    await this.findWorkflowRuleById(id);

    return this.multiTenantPrisma.workflowRule.delete({
      where: { id },
    });
  }

  // Workflow Processing
  async processProjectCreation(projectId: string, template: any) {
    const context: WorkflowContext = {
      projectId,
      metadata: {
        templateId: template.id,
        serviceType: template.serviceType,
      },
    };

    await this.processTrigger('project_created', context);
  }

  async processMilestoneCreation(milestoneId: string, projectId: string) {
    const context: WorkflowContext = {
      projectId,
      milestoneId,
    };

    await this.processTrigger('milestone_created', context);
  }

  async processTaskCompletion(
    taskId: string,
    projectId: string,
    milestoneId?: string
  ) {
    const context: WorkflowContext = {
      projectId,
      taskId,
      milestoneId,
    };

    await this.processTrigger('task_completed', context);
  }

  async processProjectStatusChange(
    projectId: string,
    oldStatus: string,
    newStatus: string
  ) {
    const context: WorkflowContext = {
      projectId,
      metadata: {
        oldStatus,
        newStatus,
      },
    };

    await this.processTrigger('project_status_changed', context);
  }

  async processMilestoneStatusChange(
    milestoneId: string,
    projectId: string,
    oldStatus: string,
    newStatus: string
  ) {
    const context: WorkflowContext = {
      projectId,
      milestoneId,
      metadata: {
        oldStatus,
        newStatus,
      },
    };

    await this.processTrigger('milestone_status_changed', context);
  }

  private async processTrigger(trigger: string, context: WorkflowContext) {
    try {
      const rules = await this.multiTenantPrisma.workflowRule.findMany({
        where: {
          trigger,
          isActive: true,
        },
      });

      for (const rule of rules) {
        if (
          await this.evaluateCondition(
            rule.condition as Record<string, any>,
            context
          )
        ) {
          await this.executeAction(
            rule.action,
            rule.parameters as Record<string, any>,
            context
          );
          this.logger.log(
            `Executed workflow rule: ${rule.name} for trigger: ${trigger}`
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error processing workflow trigger ${trigger}:`, error);
    }
  }

  private async evaluateCondition(
    condition: Record<string, any> | null,
    context: WorkflowContext
  ): Promise<boolean> {
    if (!condition) {
      return true;
    }

    try {
      // Simple condition evaluation - can be extended for complex logic
      if (condition.projectStatus) {
        const project = context.projectId
          ? await this.multiTenantPrisma.project.findUnique({
              where: { id: context.projectId },
            })
          : null;

        if (project && project.status !== condition.projectStatus) {
          return false;
        }
      }

      if (condition.milestoneStatus) {
        const milestone = context.milestoneId
          ? await this.multiTenantPrisma.milestone.findUnique({
              where: { id: context.milestoneId },
            })
          : null;

        if (milestone && milestone.status !== condition.milestoneStatus) {
          return false;
        }
      }

      if (condition.serviceType && context.metadata?.templateId) {
        const template =
          await this.multiTenantPrisma.projectTemplate.findUnique({
            where: { id: context.metadata.templateId },
          });

        if (template && template.serviceType !== condition.serviceType) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Error evaluating workflow condition:', error);
      return false;
    }
  }

  private async executeAction(
    action: string,
    parameters: Record<string, any> | null,
    context: WorkflowContext
  ) {
    try {
      switch (action) {
        case 'create_approval':
          await this.createApprovalAction(parameters, context);
          break;

        case 'send_notification':
          await this.sendNotificationAction(parameters, context);
          break;

        case 'create_task':
          await this.createTaskAction(parameters, context);
          break;

        case 'update_status':
          await this.updateStatusAction(parameters, context);
          break;

        case 'create_milestone':
          await this.createMilestoneAction(parameters, context);
          break;

        default:
          this.logger.warn(`Unknown workflow action: ${action}`);
      }
    } catch (error) {
      this.logger.error(`Error executing workflow action ${action}:`, error);
    }
  }

  private async createApprovalAction(
    parameters: Record<string, any> | null,
    context: WorkflowContext
  ) {
    if (!context.projectId) return;

    await this.multiTenantPrisma.approval.create({
      data: {
        projectId: context.projectId,
        itemType: parameters?.itemType || 'milestone',
        itemId: context.milestoneId || context.projectId,
        status: 'pending',
        note: parameters?.note || 'Auto-generated approval request',
      },
    });
  }

  private async sendNotificationAction(
    parameters: Record<string, any> | null,
    context: WorkflowContext
  ) {
    // This would integrate with your notification service
    // For now, we'll just log the notification
    this.logger.log(
      `Notification: ${parameters?.message || 'Workflow notification'}`,
      {
        context,
        parameters,
      }
    );
  }

  private async createTaskAction(
    parameters: Record<string, any> | null,
    context: WorkflowContext
  ) {
    if (!context.projectId || !parameters?.title) return;

    const dueAt = parameters?.durationDays
      ? new Date(Date.now() + parameters.durationDays * 24 * 60 * 60 * 1000)
      : null;

    await this.multiTenantPrisma.task.create({
      data: {
        projectId: context.projectId,
        title: parameters.title,
        status: 'todo',
        dueAt,
        labels: parameters?.assigneeRole || '',
      },
    });
  }

  private async updateStatusAction(
    parameters: Record<string, any> | null,
    context: WorkflowContext
  ) {
    if (!parameters?.status) return;

    if (parameters.target === 'project' && context.projectId) {
      await this.multiTenantPrisma.project.update({
        where: { id: context.projectId },
        data: { status: parameters.status },
      });
    } else if (parameters.target === 'milestone' && context.milestoneId) {
      await this.multiTenantPrisma.milestone.update({
        where: { id: context.milestoneId },
        data: { status: parameters.status },
      });
    }
  }

  private async createMilestoneAction(
    parameters: Record<string, any> | null,
    context: WorkflowContext
  ) {
    if (!context.projectId || !parameters?.title) return;

    const dueAt = parameters?.durationDays
      ? new Date(Date.now() + parameters.durationDays * 24 * 60 * 60 * 1000)
      : null;

    const milestone = await this.multiTenantPrisma.milestone.create({
      data: {
        projectId: context.projectId,
        title: parameters.title,
        status: 'todo',
        dueAt,
      },
    });

    // Trigger milestone creation workflow
    await this.processMilestoneCreation(milestone.id, context.projectId);
  }

  // Default Workflow Rules Setup
  async setupDefaultWorkflowRules() {
    const defaultRules = [
      {
        name: 'Auto-create approval for milestone completion',
        description:
          'Creates an approval request when a milestone is marked as completed',
        trigger: 'milestone_status_changed',
        condition: { newStatus: 'completed' },
        action: 'create_approval',
        parameters: {
          itemType: 'milestone',
          note: 'Milestone completed - awaiting approval',
        },
      },
      {
        name: 'Send notification for project status change',
        description:
          'Sends notification when project status changes to progress',
        trigger: 'project_status_changed',
        condition: { newStatus: 'progress' },
        action: 'send_notification',
        parameters: { message: 'Project has moved to progress status' },
      },
      {
        name: 'Create follow-up task for task completion',
        description:
          'Creates a follow-up task when certain tasks are completed',
        trigger: 'task_completed',
        condition: {},
        action: 'create_task',
        parameters: {
          title: 'Review completed work',
          durationDays: 1,
          assigneeRole: 'reviewer',
        },
      },
      {
        name: 'Auto-advance project status',
        description:
          'Automatically advances project status when all milestones are completed',
        trigger: 'milestone_status_changed',
        condition: { newStatus: 'completed' },
        action: 'update_status',
        parameters: { target: 'project', status: 'review' },
      },
    ];

    for (const rule of defaultRules) {
      const existing = await this.multiTenantPrisma.workflowRule.findFirst({
        where: { name: rule.name },
      });

      if (!existing) {
        await this.createWorkflowRule(rule);
        this.logger.log(`Created default workflow rule: ${rule.name}`);
      }
    }
  }

  // Workflow Analytics
  async getWorkflowExecutionStats() {
    // This would typically track workflow executions in a separate table
    // For now, return basic stats about active rules
    const rules = await this.findAllWorkflowRules();

    return {
      totalActiveRules: rules.length,
      rulesByTrigger: rules.reduce(
        (acc, rule) => {
          acc[rule.trigger] = (acc[rule.trigger] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      rulesByAction: rules.reduce(
        (acc, rule) => {
          acc[rule.action] = (acc[rule.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
