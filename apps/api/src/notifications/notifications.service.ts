import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

export interface CreateNotificationDto {
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: createNotificationDto.userId,
          organizationId: createNotificationDto.organizationId,
          type: createNotificationDto.type,
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          data: createNotificationDto.data || null,
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

      // Emit the notification to the user via WebSocket
      this.notificationsGateway.sendNotificationToUser(
        createNotificationDto.userId,
        notification,
      );

      return notification;
    } catch (error) {
      this.logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotificationsByUser(
    userId: string,
    organizationId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return await this.prisma.notification.findMany({
      where: {
        userId,
        organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async getUnreadNotificationsCount(userId: string, organizationId: string) {
    return await this.prisma.notification.count({
      where: {
        userId,
        organizationId,
        readAt: null,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return await this.prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string, organizationId: string) {
    return await this.prisma.notification.updateMany({
      where: {
        userId,
        organizationId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async sendProjectStatusChangeNotification(
    userId: string,
    organizationId: string,
    projectId: string,
    projectName: string,
    oldStatus: string,
    newStatus: string,
  ) {
    const title = `Project Status Changed: ${projectName}`;
    const message = `Project status changed from ${oldStatus} to ${newStatus}`;
    
    return await this.createNotification({
      userId,
      organizationId,
      type: 'project_status_change',
      title,
      message,
      data: {
        projectId,
        oldStatus,
        newStatus,
      },
    });
  }

  async sendAssignedTicketNotification(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketTitle: string,
    assignedBy: string,
  ) {
    const title = `Ticket Assigned: ${ticketTitle}`;
    const message = `You have been assigned a new ticket by ${assignedBy}`;
    
    return await this.createNotification({
      userId,
      organizationId,
      type: 'assigned_ticket',
      title,
      message,
      data: {
        ticketId,
        assignedBy,
      },
    });
  }

  async sendInvoicePaymentNotification(
    userId: string,
    organizationId: string,
    invoiceId: string,
    invoiceAmount: number,
    status: string,
  ) {
    const title = `Invoice Payment: ${status}`;
    const message = `Invoice payment status updated to ${status}`;
    
    return await this.createNotification({
      userId,
      organizationId,
      type: 'invoice_payment',
      title,
      message,
      data: {
        invoiceId,
        amount: invoiceAmount,
        status,
      },
    });
  }

  async sendApprovalRequestNotification(
    userId: string,
    organizationId: string,
    approvalId: string,
    itemType: string,
    itemTitle: string,
  ) {
    const title = `Approval Request: ${itemType}`;
    const message = `New approval request for ${itemTitle}`;
    
    return await this.createNotification({
      userId,
      organizationId,
      type: 'approval_request',
      title,
      message,
      data: {
        approvalId,
        itemType,
        itemTitle,
      },
    });
  }
}