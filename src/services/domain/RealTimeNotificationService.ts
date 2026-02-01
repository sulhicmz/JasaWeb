import type {
  RealTimeNotification,
  NotificationType,
  NotificationPriority
} from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import { UserRole, webSocketService, type WSMessage } from '../shared/WebSocketService';

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, any>;
  priority?: NotificationPriority;
}

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: Record<NotificationPriority, number>;
  byType: Record<NotificationType, number>;
}

export class RealTimeNotificationService {
  private static instance: RealTimeNotificationService;

  static getInstance(): RealTimeNotificationService {
    if (!RealTimeNotificationService.instance) {
      RealTimeNotificationService.instance = new RealTimeNotificationService();
    }
    return RealTimeNotificationService.instance;
  }

  async createNotification(
    context: any,
    userId: string,
    data: NotificationData
  ): Promise<RealTimeNotification> {
    const prisma = getPrisma(context);
    
    try {
      const notification = await prisma.realTimeNotification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          payload: data.payload || undefined,
          priority: data.priority || 'medium'
        }
      });

      await this.sendRealtimeNotification(context, notification);
      
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  async bulkCreateNotifications(
    context: any,
    userIds: string[],
    data: NotificationData
  ): Promise<RealTimeNotification[]> {
    const prisma = getPrisma(context);
    
    try {
      const notifications = await Promise.all(
        userIds.map(userId =>
          prisma.realTimeNotification.create({
            data: {
              userId,
              type: data.type,
              title: data.title,
              message: data.message,
payload: data.payload || undefined,
              priority: data.priority || 'medium'
            }
          })
        )
      );

      await Promise.all(
        notifications.map(notification =>
          this.sendRealtimeNotification(context, notification)
        )
      );
      
      return notifications;
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
      throw error;
    }
  }

  async sendByRole(
    context: any,
    role: UserRole,
    data: NotificationData
  ): Promise<RealTimeNotification[]> {
    const prisma = getPrisma(context);
    
    try {
      const users = await prisma.user.findMany({
        where: { role }
      });

      const userIds = users.map(user => user.id);
      return this.bulkCreateNotifications(context, userIds, data);
    } catch (error) {
      console.error('Failed to send notifications by role:', error);
      throw error;
    }
  }

  async sendToAll(
    context: any,
    data: NotificationData
  ): Promise<RealTimeNotification[]> {
    const prisma = getPrisma(context);
    
    try {
      const users = await prisma.user.findMany();
      const userIds = users.map(user => user.id);
      return this.bulkCreateNotifications(context, userIds, data);
    } catch (error) {
      console.error('Failed to send notifications to all users:', error);
      throw error;
    }
  }

  async getNotifications(
    context: any,
    filters: NotificationFilters
  ): Promise<RealTimeNotification[]> {
    const prisma = getPrisma(context);
    
    try {
      const whereClause: any = {};
      
      if (filters.userId) whereClause.userId = filters.userId;
      if (filters.type) whereClause.type = filters.type;
      if (filters.priority) whereClause.priority = filters.priority;
      if (filters.read !== undefined) whereClause.read = filters.read;

      const notifications = await prisma.realTimeNotification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: { user: { select: { id: true, name: true, email: true } } }
      });

      return notifications;
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async markAsRead(
    context: any,
    notificationId: string,
    userId: string
  ): Promise<RealTimeNotification> {
    const prisma = getPrisma(context);
    
    try {
      const notification = await prisma.realTimeNotification.update({
        where: { 
          id: notificationId,
          userId
        },
        data: { 
          read: true,
          readAt: new Date()
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(context: any, userId: string): Promise<number> {
    const prisma = getPrisma(context);
    
    try {
      const result = await prisma.realTimeNotification.updateMany({
        where: { 
          userId,
          read: false
        },
        data: { 
          read: true,
          readAt: new Date()
        }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(
    context: any,
    notificationId: string,
    userId: string
  ): Promise<void> {
    const prisma = getPrisma(context);
    
    try {
      await prisma.realTimeNotification.delete({
        where: { 
          id: notificationId,
          userId
        }
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  async getNotificationStats(
    context: any,
    userId: string
  ): Promise<NotificationStats> {
    const prisma = getPrisma(context);
    
    try {
      const notifications = await prisma.realTimeNotification.findMany({
        where: { userId }
      });

      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        } as Record<NotificationPriority, number>,
        byType: {} as Record<NotificationType, number>
      };

      notifications.forEach(notification => {
        stats.byPriority[notification.priority] = 
          (stats.byPriority[notification.priority] || 0) + 1;
        stats.byType[notification.type] = 
          (stats.byType[notification.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  async cleanupOldNotifications(context: any, daysOld: number = 30): Promise<number> {
    const prisma = getPrisma(context);
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.realTimeNotification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          read: true
        }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
      throw error;
    }
  }

  private async sendRealtimeNotification(
    context: any,
    notification: RealTimeNotification
  ): Promise<void> {
    try {
      const message: WSMessage = {
        type: 'system_alert',
        payload: {
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            createdAt: notification.createdAt
          }
        },
        timestamp: Date.now(),
        id: this.generateEventId(),
        userId: notification.userId
      };

      await webSocketService.sendToUser(context, notification.userId, message);
    } catch (error) {
      console.error('Failed to send realtime notification:', error);
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export const realTimeNotificationService = RealTimeNotificationService.getInstance();