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
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthService } from '../auth/auth.service';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(RolesGuard)
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private connectedClients = new Map<
    string,
    { userId: string; organizationId: string }
  >();

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      // Validate token and get user info
      const user = await this.authService.verifyToken(token);
      if (!user) {
        client.disconnect();
        return;
      }

      // Get organization ID from token or query params
      const organizationId = client.handshake.query.organizationId as string;
      if (!organizationId) {
        client.disconnect();
        return;
      }

      // Store client info
      this.connectedClients.set(client.id, {
        userId: user.id,
        organizationId,
      });

      // Join organization-specific room
      await client.join(`org-${organizationId}`);

      console.log(
        `Client connected: ${client.id} for organization: ${organizationId}`
      );

      // Send initial connection confirmation
      client.emit('connected', {
        status: 'connected',
        organizationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-dashboard')
  async handleSubscribeDashboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId: string }
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo || clientInfo.organizationId !== data.organizationId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    await client.join(`dashboard-${data.organizationId}`);
    client.emit('subscribed', {
      channel: 'dashboard',
      organizationId: data.organizationId,
    });
  }

  // Methods to broadcast updates to specific organization
  broadcastStatsUpdate(organizationId: string, stats: any) {
    this.server.to(`dashboard-${organizationId}`).emit('stats-update', {
      organizationId,
      stats,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastActivityUpdate(organizationId: string, activity: any) {
    this.server.to(`dashboard-${organizationId}`).emit('activity-update', {
      organizationId,
      activity,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastProjectUpdate(organizationId: string, project: any) {
    this.server.to(`dashboard-${organizationId}`).emit('project-update', {
      organizationId,
      project,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastTicketUpdate(organizationId: string, ticket: any) {
    this.server.to(`dashboard-${organizationId}`).emit('ticket-update', {
      organizationId,
      ticket,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastInvoiceUpdate(organizationId: string, invoice: any) {
    this.server.to(`dashboard-${organizationId}`).emit('invoice-update', {
      organizationId,
      invoice,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected clients count for an organization
  getConnectedClientsCount(organizationId: string): number {
    let count = 0;
    for (const client of this.connectedClients.values()) {
      if (client.organizationId === organizationId) {
        count++;
      }
    }
    return count;
  }
}
