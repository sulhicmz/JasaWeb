import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  actorId: string; // ID of the user performing the action
  organizationId: string; // Organization where the action occurred
  action: string; // Description of the action (e.g., 'file_upload', 'project_update', 'user_login')
  target?: string; // Target of the action (e.g., 'User', 'Project', 'File')
  targetId?: string; // ID of the specific target
  meta?: Record<string, unknown>; // Additional metadata about the action
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          organizationId: entry.organizationId,
          action: entry.action,
          target: entry.target || '',
          meta: (entry.meta as Prisma.JsonObject) || {},
        },
      });

      this.logger.log(
        `Audit log created: ${entry.action} by user ${entry.actorId} in org ${entry.organizationId}`
      );
      // We don't throw an error here because failing to log shouldn't break the main functionality
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create audit log: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      // We don't throw an error here because failing to log shouldn't break the main functionality
    }
  }

  /**
   * Log user login event
   */
  async logUserLogin(userId: string, organizationId: string): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'user_login',
      target: 'User',
      targetId: userId,
    });
  }

  /**
   * Log file upload event
   */
  async logFileUpload(
    userId: string,
    organizationId: string,
    fileId: string,
    fileName: string
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'file_upload',
      target: 'File',
      targetId: fileId,
      meta: {
        fileName,
      },
    });
  }

  /**
   * Log file deletion event
   */
  async logFileDeletion(
    userId: string,
    organizationId: string,
    fileId: string,
    fileName: string
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'file_deletion',
      target: 'File',
      targetId: fileId,
      meta: {
        fileName,
      },
    });
  }

  /**
   * Log project creation event
   */
  async logProjectCreation(
    userId: string,
    organizationId: string,
    projectId: string,
    projectName: string
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'project_creation',
      target: 'Project',
      targetId: projectId,
      meta: {
        projectName,
      },
    });
  }

  /**
   * Log project update event
   */
  async logProjectUpdate(
    userId: string,
    organizationId: string,
    projectId: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'project_update',
      target: 'Project',
      targetId: projectId,
      meta: {
        changes,
      },
    });
  }

  /**
   * Log approval request event
   */
  async logApprovalRequest(
    userId: string,
    organizationId: string,
    approvalId: string,
    itemType: string
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'approval_request',
      target: 'Approval',
      targetId: approvalId,
      meta: {
        itemType,
      },
    });
  }

  /**
   * Log approval decision event
   */
  async logApprovalDecision(
    userId: string,
    organizationId: string,
    approvalId: string,
    decision: string
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'approval_decision',
      target: 'Approval',
      targetId: approvalId,
      meta: {
        decision,
      },
    });
  }

  /**
   * Log ticket creation event
   */
  async logTicketCreation(
    userId: string,
    organizationId: string,
    ticketId: string,
    title: string
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'ticket_creation',
      target: 'Ticket',
      targetId: ticketId,
      meta: {
        title,
      },
    });
  }

  /**
   * Log ticket update event
   */
  async logTicketUpdate(
    userId: string,
    organizationId: string,
    ticketId: string,
    changes: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'ticket_update',
      target: 'Ticket',
      targetId: ticketId,
      meta: {
        changes,
      },
    });
  }

  /**
   * Log invoice creation event
   */
  async logInvoiceCreation(
    userId: string,
    organizationId: string,
    invoiceId: string,
    amount: number
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'invoice_creation',
      target: 'Invoice',
      targetId: invoiceId,
      meta: {
        amount,
      },
    });
  }

  /**
   * Log invoice payment event
   */
  async logInvoicePayment(
    userId: string,
    organizationId: string,
    invoiceId: string,
    amount: number
  ): Promise<void> {
    await this.log({
      actorId: userId,
      organizationId,
      action: 'invoice_payment',
      target: 'Invoice',
      targetId: invoiceId,
      meta: {
        amount,
      },
    });
  }
}
