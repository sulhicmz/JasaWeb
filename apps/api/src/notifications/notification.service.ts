import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { NotificationGateway } from './notification.gateway';

export type NotificationType =
  | 'project_update'
  | 'task_assigned'
  | 'task_completed'
  | 'approval_request'
  | 'approval_approved'
  | 'approval_rejected'
  | 'ticket_created'
  | 'ticket_updated'
  | 'invoice_issued'
  | 'invoice_paid'
  | 'file_uploaded'
  | 'milestone_completed'
  | 'team_invitation';

export interface NotificationData {
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  approvalId?: string;
  approvalType?: string;
  ticketId?: string;
  ticketTitle?: string;
  invoiceId?: string;
  invoiceAmount?: number;
  fileId?: string;
  fileName?: string;
  milestoneId?: string;
  milestoneTitle?: string;
  actorId?: string;
  actorName?: string;
  [key: string]: any;
}

export interface CreateNotificationDto {
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly notificationGateway: NotificationGateway
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<void> {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferencesInternal(
        dto.userId,
        dto.organizationId,
        dto.type
      );

      // Create notification in database
      if (preferences.inAppEnabled) {
        const notification = await this.multiTenantPrisma.notification.create({
          data: {
            userId: dto.userId,
            organizationId: dto.organizationId,
            type: dto.type,
            title: dto.title,
            message: dto.message,
            data: dto.data || {},
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Send real-time notification via WebSocket
        this.notificationGateway.sendNotificationToUser(dto.userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });

        this.logger.log(
          `Notification created: ${notification.type} for user ${dto.userId}`
        );
      }

      // TODO: Send email notification if enabled
      // TODO: Send browser notification if enabled
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create notification: ${errorMessage}`,
        errorStack
      );
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ) {
    const { limit = 50, offset = 0, unreadOnly = false, type } = options;

    const where: any = {
      userId,
      organizationId,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      this.multiTenantPrisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.multiTenantPrisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      unread: await this.getUnreadCount(userId, organizationId),
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.multiTenantPrisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    // Update real-time status
    this.notificationGateway.sendNotificationUpdate(userId, {
      notificationId,
      isRead: true,
    });
  }

  async markAllAsRead(userId: string, organizationId: string): Promise<void> {
    await this.multiTenantPrisma.notification.updateMany({
      where: {
        userId,
        organizationId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Send update to user
    this.notificationGateway.sendNotificationUpdate(userId, {
      allRead: true,
    });
  }

  async getUnreadCount(
    userId: string,
    organizationId: string
  ): Promise<number> {
    return this.multiTenantPrisma.notification.count({
      where: {
        userId,
        organizationId,
        isRead: false,
      },
    });
  }

  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    await this.multiTenantPrisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  private async getUserPreferencesInternal(
    userId: string,
    organizationId: string,
    type: NotificationType
  ) {
    let preferences =
      await this.multiTenantPrisma.notificationPreference.findUnique({
        where: {
          userId_organizationId_type: {
            userId,
            organizationId,
            type,
          },
        },
      });

    // Create default preferences if not found
    if (!preferences) {
      preferences = await this.multiTenantPrisma.notificationPreference.create({
        data: {
          userId,
          organizationId,
          type,
          inAppEnabled: true,
          emailEnabled: true,
          browserEnabled: false,
        },
      });
    }

    return preferences;
  }

  // Convenience methods for common notification types
  async notifyProjectUpdate(
    userId: string,
    organizationId: string,
    projectId: string,
    projectName: string,
    actorName: string
  ) {
    await this.createNotification({
      userId,
      organizationId,
      type: 'project_update',
      title: 'Project Updated',
      message: `${actorName} updated project "${projectName}"`,
      data: {
        projectId,
        projectName,
        actorName,
      },
    });
  }

  async notifyTaskAssigned(
    userId: string,
    organizationId: string,
    taskId: string,
    taskTitle: string,
    projectName: string,
    actorName: string
  ) {
    await this.createNotification({
      userId,
      organizationId,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `${actorName} assigned you to task "${taskTitle}" in ${projectName}`,
      data: {
        taskId,
        taskTitle,
        projectName,
        actorName,
      },
    });
  }

  async notifyApprovalRequest(
    userId: string,
    organizationId: string,
    approvalId: string,
    approvalType: string,
    projectName: string,
    actorName: string
  ) {
    await this.createNotification({
      userId,
      organizationId,
      type: 'approval_request',
      title: 'Approval Requested',
      message: `${actorName} requested approval for ${approvalType} in ${projectName}`,
      data: {
        approvalId,
        approvalType,
        projectName,
        actorName,
      },
    });
  }

  async notifyTicketCreated(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketTitle: string,
    projectName: string,
    actorName: string
  ) {
    await this.createNotification({
      userId,
      organizationId,
      type: 'ticket_created',
      title: 'Ticket Created',
      message: `${actorName} created ticket "${ticketTitle}"${projectName ? ` in ${projectName}` : ''}`,
      data: {
        ticketId,
        ticketTitle,
        projectName,
        actorName,
      },
    });
  }

  async notifyFileUploaded(
    userId: string,
    organizationId: string,
    fileId: string,
    fileName: string,
    projectName: string,
    actorName: string
  ) {
    await this.createNotification({
      userId,
      organizationId,
      type: 'file_uploaded',
      title: 'File Uploaded',
      message: `${actorName} uploaded "${fileName}" to ${projectName}`,
      data: {
        fileId,
        fileName,
        projectName,
        actorName,
      },
    });
  }

  async getUserPreferences(userId: string, organizationId: string) {
    const preferences =
      await this.multiTenantPrisma.notificationPreference.findMany({
        where: {
          userId,
          organizationId,
        },
        orderBy: {
          type: 'asc',
        },
      });

    // If no preferences exist, return default ones
    if (preferences.length === 0) {
      const defaultTypes: NotificationType[] = [
        'project_update',
        'task_assigned',
        'task_completed',
        'approval_request',
        'approval_approved',
        'approval_rejected',
        'ticket_created',
        'ticket_updated',
        'invoice_issued',
        'invoice_paid',
        'file_uploaded',
        'milestone_completed',
        'team_invitation',
      ];

      return defaultTypes.map((type) => ({
        type,
        inAppEnabled: true,
        emailEnabled: true,
        browserEnabled: false,
      }));
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    organizationId: string,
    preferences: Array<{
      type: string;
      inAppEnabled: boolean;
      emailEnabled: boolean;
      browserEnabled: boolean;
    }>
  ) {
    await this.multiTenantPrisma.$transaction(async (tx: any) => {
      for (const pref of preferences) {
        await tx.notificationPreference.upsert({
          where: {
            userId_organizationId_type: {
              userId,
              organizationId,
              type: pref.type,
            },
          },
          update: {
            inAppEnabled: pref.inAppEnabled,
            emailEnabled: pref.emailEnabled,
            browserEnabled: pref.browserEnabled,
          },
          create: {
            userId,
            organizationId,
            type: pref.type,
            inAppEnabled: pref.inAppEnabled,
            emailEnabled: pref.emailEnabled,
            browserEnabled: pref.browserEnabled,
          },
        });
      }
    });
  }
}
