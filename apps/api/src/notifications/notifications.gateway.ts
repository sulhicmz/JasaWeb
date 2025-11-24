import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationsGateway');

  constructor(private readonly notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Client authentication would happen here in a real implementation
    // For now, we're not requiring authentication on connection
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
    
    // Also emit to the user's connected sockets
    this.server.to(`user_${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user ${userId}: ${notification.title}`);
  }

  // Send notification to multiple users
  sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Send notification to all users in an organization
  sendNotificationToOrganization(organizationId: string, notification: any) {
    this.server.to(`org_${organizationId}`).emit('notification', notification);
    this.logger.log(
      `Notification sent to organization ${organizationId}: ${notification.title}`,
    );
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user_${userId}`);
    this.logger.log(`Client ${client.id} joined user room ${userId}`);
  }

  @SubscribeMessage('join_org_room')
  handleJoinOrgRoom(
    @MessageBody() organizationId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`org_${organizationId}`);
    this.logger.log(
      `Client ${client.id} joined organization room ${organizationId}`,
    );
  }

  @SubscribeMessage('mark-read')
  handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // In a real implementation, you would extract the user ID from the socket
    // For this example, we'll just log the action
    this.logger.log(`Marking notification ${data.notificationId} as read`);
  }

  @SubscribeMessage('mark-all-read')
  handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    // In a real implementation, you would extract the user ID from the socket
    this.logger.log(`Marking all notifications as read for client ${client.id}`);
  }

  @SubscribeMessage('get-unread-count')
  handleGetUnreadCount(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    // In a real implementation, you would call the service to get the count
    // For this example, we'll just emit a dummy response
    this.server.to(client.id).emit('unread-count', { count: 5 });
  }
}