import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/database/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
}

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationUpdatePayload {
  notificationId?: string;
  isRead?: boolean;
  allRead?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:4321',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate the WebSocket connection
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(
          `Connection rejected: No token provided for socket ${client.id}`
        );
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          memberships: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        this.logger.warn(
          `Connection rejected: User not found for socket ${client.id}`
        );
        client.disconnect();
        return;
      }

      // Set user context on socket
      client.userId = user.id;
      client.organizationId = user.memberships[0]?.organizationId;

      // Track socket for user
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(client.id);

      // Join user to their personal room
      await client.join(`user:${user.id}`);

      // Join organization room if applicable
      if (client.organizationId) {
        await client.join(`org:${client.organizationId}`);
      }

      this.logger.log(`User ${user.id} connected with socket ${client.id}`);

      // Send initial unread count
      // Note: This would require access to NotificationService, but to avoid circular dependency
      // we'll emit this from the service when needed
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Authentication failed';
      this.logger.error(
        `Authentication failed for socket ${client.id}: ${errorMessage}`
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.userSockets.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }

    this.logger.log(`Socket ${client.id} disconnected`);
  }

  @SubscribeMessage('mark-read')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // This would typically call NotificationService.markAsRead
    // For now, we'll broadcast the update to the user's other sockets
    client.to(`user:${client.userId}`).emit('notification-update', {
      notificationId: data.notificationId,
      isRead: true,
    });

    return { success: true };
  }

  @SubscribeMessage('mark-all-read')
  async handleMarkAllAsRead(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // Broadcast to all user's sockets
    this.server.to(`user:${client.userId}`).emit('notification-update', {
      allRead: true,
    });

    return { success: true };
  }

  @SubscribeMessage('get-unread-count')
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    // This would typically get the count from NotificationService
    // For now, we'll emit a placeholder
    client.emit('unread-count', { count: 0 });
  }

  // Methods to send notifications to users
  sendNotificationToUser(userId: string, notification: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.log(
      `Notification sent to user ${userId}: ${notification.type}`
    );
  }

  sendNotificationToOrganization(
    organizationId: string,
    notification: NotificationPayload
  ) {
    this.server.to(`org:${organizationId}`).emit('notification', notification);
    this.logger.log(
      `Notification sent to organization ${organizationId}: ${notification.type}`
    );
  }

  sendNotificationUpdate(userId: string, update: NotificationUpdatePayload) {
    this.server.to(`user:${userId}`).emit('notification-update', update);
    this.logger.log(`Notification update sent to user ${userId}`);
  }

  sendUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('unread-count', { count });
  }

  // Check if user is online (has active connections)
  isUserOnline(userId: string): boolean {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0
    );
  }

  // Get number of active connections for a user
  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }
}
