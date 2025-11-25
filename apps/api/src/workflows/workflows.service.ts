import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateWorkflowDto {
  organizationId: string;
  name: string;
  description?: string;
  trigger: string; // ticket_created, project_status_change, etc.
  conditions: any; // JSON object with conditions
  actions: any[]; // Array of actions to perform
  isActive: boolean;
}

export interface ExecuteWorkflowDto {
  workflowId: string;
  triggerEvent: string;
  context: any; // Context data from the trigger
}

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createWorkflow(createWorkflowDto: CreateWorkflowDto) {
    return await this.prisma.workflow.create({
      data: {
        organizationId: createWorkflowDto.organizationId,
        name: createWorkflowDto.name,
        description: createWorkflowDto.description,
        trigger: createWorkflowDto.trigger,
        conditions: createWorkflowDto.conditions,
        actions: createWorkflowDto.actions,
        isActive: createWorkflowDto.isActive,
      },
    });
  }

  async getWorkflows(organizationId: string) {
    return await this.prisma.workflow.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });
  }

  async getWorkflowById(workflowId: string, organizationId: string) {
    return await this.prisma.workflow.findFirst({
      where: {
        id: workflowId,
        organizationId,
      },
    });
  }

  async updateWorkflow(workflowId: string, organizationId: string, updateData: any) {
    return await this.prisma.workflow.update({
      where: {
        id: workflowId,
        organizationId,
      },
      data: updateData,
    });
  }

  async deleteWorkflow(workflowId: string, organizationId: string) {
    return await this.prisma.workflow.delete({
      where: {
        id: workflowId,
        organizationId,
      },
    });
  }

  async toggleWorkflow(workflowId: string, organizationId: string, isActive: boolean) {
    return await this.prisma.workflow.update({
      where: {
        id: workflowId,
        organizationId,
      },
      data: {
        isActive,
      },
    });
  }

  async executeWorkflow(dto: ExecuteWorkflowDto) {
    const workflow = await this.prisma.workflow.findUnique({
      where: {
        id: dto.workflowId,
      },
    });

    if (!workflow || !workflow.isActive) {
      throw new Error('Workflow not found or not active');
    }

    // Create execution record
    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId: dto.workflowId,
        triggerEvent: dto.triggerEvent,
        context: dto.context,
        status: 'in-progress',
      },
    });

    try {
      // Evaluate conditions
      const conditionsMet = this.evaluateConditions(dto.context, workflow.conditions);
      
      if (!conditionsMet) {
        await this.prisma.workflowExecution.update({
          where: { id: execution.id },
          data: { status: 'completed' },
        });
        return { success: true, message: 'Conditions not met, workflow skipped' };
      }

      // Execute actions
      for (const action of workflow.actions) {
        await this.executeAction(action, dto.context);
      }

      // Update execution status
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { status: 'completed' },
      });

      return { success: true, executionId: execution.id };
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
      
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { 
          status: 'failed',
          error: error.message,
        },
      });

      return { success: false, error: error.message };
    }
  }

  async triggerWorkflows(triggerEvent: string, context: any, organizationId: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: {
        organizationId,
        trigger: triggerEvent,
        isActive: true,
      },
    });

    const results = [];
    for (const workflow of workflows) {
      const result = await this.executeWorkflow({
        workflowId: workflow.id,
        triggerEvent,
        context,
      });
      results.push({ workflowId: workflow.id, result });
    }

    return results;
  }

  private evaluateConditions(context: any, conditions: any): boolean {
    // Simple condition evaluation - in a real implementation, this would be more complex
    if (!conditions || Object.keys(conditions).length === 0) {
      return true; // If no conditions, always execute
    }

    // Example: Check if a specific field matches a value
    for (const [field, expectedValue] of Object.entries(conditions)) {
      if (context[field] !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  private async executeAction(action: any, context: any) {
    const { type, config } = action;

    switch (type) {
      case 'send_notification':
        await this.executeSendNotificationAction(config, context);
        break;
      case 'assign_ticket':
        await this.executeAssignTicketAction(config, context);
        break;
      case 'update_project_status':
        await this.executeUpdateProjectStatusAction(config, context);
        break;
      case 'create_task':
        await this.executeCreateTaskAction(config, context);
        break;
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  private async executeSendNotificationAction(config: any, context: any) {
    const { userId, title, message, type } = config;
    
    // In a real implementation, we would use the NotificationsService to send the notification
    // For now, we'll just log it
    this.logger.log(`Would send notification to user ${userId}: ${title} - ${message}`);
    
    // Example of how to send an actual notification:
    // await this.notificationsService.createNotification({
    //   userId,
    //   organizationId: context.organizationId,
    //   type: type || 'workflow',
    //   title,
    //   message,
    //   data: context,
    // });
  }

  private async executeAssignTicketAction(config: any, context: any) {
    const { ticketId, assigneeId } = config;
    
    // Update the ticket with the new assignee
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId },
    });

    this.logger.log(`Assigned ticket ${ticketId} to user ${assigneeId}`);
  }

  private async executeUpdateProjectStatusAction(config: any, context: any) {
    const { projectId, newStatus } = config;
    
    // Update the project status
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: newStatus },
    });

    this.logger.log(`Updated project ${projectId} status to ${newStatus}`);
  }

  private async executeCreateTaskAction(config: any, context: any) {
    const { projectId, title, assigneeId, description } = config;
    
    // Create a new task
    await this.prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assigneeId,
        status: 'todo', // Default to 'todo'
      },
    });

    this.logger.log(`Created task "${title}" in project ${projectId}`);
  }
}