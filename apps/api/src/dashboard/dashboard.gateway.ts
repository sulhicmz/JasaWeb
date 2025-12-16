import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { APP_URLS, CACHE_KEYS } from '../common/config/constants';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
  userRole?: Role;
}

interface DashboardUpdatePayload {
  type: 'stats' | 'activity' | 'project' | 'ticket' | 'milestone' | 'invoice';
  data: Record<string, unknown>;
  timestamp: Date;
  organizationId: string;
}

@WebSocketGateway({
  cors: {
    origin: APP_URLS.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/dashboard',
})
export class DashboardGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;
  private logger: Logger = new Logger('DashboardGateway');

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private jwtService: JwtService,
    private readonly multiTenantPrisma: MultiTenantPrismaService
  ) {}

  afterInit(_server: Server) {
    this.logger.log('Dashboard WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate the connection
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.organizationId = payload.organizationId;
      client.userRole = payload.role;

      // Verify user exists and has access to the organization
      const users = await this.multiTenantPrisma.user.findMany({
        where: {
          id: payload.sub,
        },
      });
      const user = users[0];

      if (
        !user ||
        (user as { memberships?: unknown[] }).memberships?.length === 0
      ) {
        throw new WsException(
          'Unauthorized: Invalid user or organization access'
        );
      }

      // Join organization-specific room
      const roomName = `org-${payload.organizationId}`;
      await client.join(roomName);

      // Join user-specific room for personal notifications
      const userRoomName = `user-${payload.sub}`;
      await client.join(userRoomName);

      this.logger.log(
        `Client ${client.id} connected for organization ${payload.organizationId}`
      );

      // Send initial dashboard data
      await this.sendInitialData(client, payload.organizationId);
    } catch (error) {
      this.logger.error(
        `Connection error: ${error instanceof Error ? error.message : String(error)}`
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe-dashboard')
  async handleSubscribeDashboard(
    @MessageBody() data: { organizationId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (client.organizationId !== data.organizationId) {
      throw new WsException(
        'Unauthorized: Cannot subscribe to different organization'
      );
    }

    const roomName = `org-${data.organizationId}`;
    await client.join(roomName);

    client.emit('subscribed', { room: roomName });
    this.logger.log(
      `Client ${client.id} subscribed to dashboard updates for org ${data.organizationId}`
    );
  }

  @SubscribeMessage('unsubscribe-dashboard')
  async handleUnsubscribeDashboard(
    @MessageBody() data: { organizationId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    const roomName = `org-${data.organizationId}`;
    await client.leave(roomName);

    client.emit('unsubscribed', { room: roomName });
    this.logger.log(
      `Client ${client.id} unsubscribed from dashboard updates for org ${data.organizationId}`
    );
  }

  @SubscribeMessage('refresh-stats')
  @UseGuards(RolesGuard)
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async handleRefreshStats(
    @MessageBody() data: { organizationId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (client.organizationId !== data.organizationId) {
      throw new WsException(
        'Unauthorized: Cannot access different organization data'
      );
    }

    try {
      const stats = await this.getDashboardStats(data.organizationId);

      // Broadcast to all clients in the organization
      this.server.to(`org-${data.organizationId}`).emit('stats-updated', {
        stats,
        timestamp: new Date(),
      });

      // Clear cache to force fresh data on next request
      await this.cacheManager.del(
        CACHE_KEYS.DASHBOARD_STATS(data.organizationId)
      );
    } catch (error) {
      this.logger.error(
        `Error refreshing stats: ${error instanceof Error ? error.message : String(error)}`
      );
      client.emit('error', { message: 'Failed to refresh stats' });
    }
  }

  // Public method to broadcast updates from other services
  async broadcastDashboardUpdate(payload: DashboardUpdatePayload) {
    const roomName = `org-${payload.organizationId}`;

    this.server.to(roomName).emit('dashboard-update', {
      type: payload.type,
      data: payload.data,
      timestamp: payload.timestamp,
    });

    // Also send to specific user rooms if it's user-specific
    if (payload.data.userId) {
      this.server.to(`user-${payload.data.userId}`).emit('personal-update', {
        type: payload.type,
        data: payload.data,
        timestamp: payload.timestamp,
      });
    }

    this.logger.log(
      `Broadcasted ${payload.type} update to organization ${payload.organizationId}`
    );
  }

  private async sendInitialData(
    client: AuthenticatedSocket,
    organizationId: string
  ) {
    try {
      const [stats, recentActivity] = await Promise.all([
        this.getDashboardStats(organizationId),
        this.getRecentActivity(organizationId),
      ]);

      client.emit('initial-data', {
        stats,
        recentActivity,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Error sending initial data: ${error instanceof Error ? error.message : String(error)}`
      );
      client.emit('error', { message: 'Failed to load initial data' });
    }
  }

  private async getDashboardStats(organizationId: string) {
    const cacheKey = CACHE_KEYS.DASHBOARD_STATS(organizationId);
    let stats = await this.cacheManager.get(cacheKey);

    if (!stats) {
      const [projectsStats, ticketsStats, invoicesStats, milestonesStats] =
        await Promise.all([
          this.getProjectsStats(organizationId),
          this.getTicketsStats(organizationId),
          this.getInvoicesStats(organizationId),
          this.getMilestonesStats(organizationId),
        ]);

      stats = {
        projects: projectsStats,
        tickets: ticketsStats,
        invoices: invoicesStats,
        milestones: milestonesStats,
      };

      // Cache for 2 minutes for real-time users
      await this.cacheManager.set(cacheKey, stats, 120000);
    }

    return stats;
  }

  private async getRecentActivity(organizationId: string, limit: number = 10) {
    const [recentProjects, recentTickets, recentMilestones, recentInvoices] =
      await Promise.all([
        this.getRecentProjects(organizationId, Math.ceil(limit / 4)),
        this.getRecentTickets(organizationId, Math.ceil(limit / 4)),
        this.getRecentMilestones(organizationId, Math.ceil(limit / 4)),
        this.getRecentInvoices(organizationId, Math.ceil(limit / 4)),
      ]);

    const allActivities = [
      ...recentProjects,
      ...recentTickets,
      ...recentMilestones,
      ...recentInvoices,
    ];

    return allActivities
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit);
  }

  private async getProjectsStats(organizationId: string) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      select: { status: true },
    });

    const total = projects.length;
    const active = projects.filter(
      (p) => p.status === 'active' || p.status === 'in-progress'
    ).length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const onHold = projects.filter((p) => p.status === 'on-hold').length;

    return { total, active, completed, onHold };
  }

  private async getTicketsStats(organizationId: string) {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: { organizationId },
      select: { status: true, priority: true },
    });

    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in-progress').length;
    const highPriority = tickets.filter(
      (t) =>
        (t.priority === 'high' || t.priority === 'critical') &&
        (t.status === 'open' || t.status === 'in-progress')
    ).length;
    const critical = tickets.filter(
      (t) =>
        t.priority === 'critical' &&
        (t.status === 'open' || t.status === 'in-progress')
    ).length;

    return { total, open, inProgress, highPriority, critical };
  }

  private async getInvoicesStats(organizationId: string) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: { organizationId },
      select: { status: true, amount: true, dueAt: true },
    });

    const total = invoices.length;
    const pending = invoices.filter(
      (i) => i.status === 'draft' || i.status === 'issued'
    ).length;
    const overdue = invoices.filter(
      (i) =>
        (i.status === 'issued' || i.status === 'overdue') &&
        new Date(i.dueAt) < new Date()
    ).length;

    const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingAmount = invoices
      .filter((i) => i.status === 'draft' || i.status === 'issued')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    return { total, pending, overdue, totalAmount, pendingAmount };
  }

  private async getMilestonesStats(organizationId: string) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        project: {
          organizationId,
        },
      },
      select: { status: true, dueAt: true },
    });

    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === 'completed').length;
    const overdue = milestones.filter(
      (m) => m.status !== 'completed' && m.dueAt && new Date(m.dueAt) < now
    ).length;
    const dueThisWeek = milestones.filter(
      (m) =>
        m.status !== 'completed' &&
        m.dueAt &&
        new Date(m.dueAt) >= now &&
        new Date(m.dueAt) <= weekFromNow
    ).length;

    return { total, completed, overdue, dueThisWeek };
  }

  private async getRecentProjects(organizationId: string, limit: number) {
    const projects = await this.multiTenantPrisma.project.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return projects.map((project) => ({
      id: project.id,
      type: 'project' as const,
      title: project.name,
      description: 'No description',
      status: project.status,
      createdAt: project.updatedAt,
    }));
  }

  private async getRecentTickets(organizationId: string, limit: number) {
    const tickets = await this.multiTenantPrisma.ticket.findMany({
      where: { organizationId },
      select: {
        id: true,
        type: true,
        priority: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return tickets.map((ticket) => ({
      id: ticket.id,
      type: 'ticket' as const,
      title: `${ticket.type} ticket`,
      description: `Priority: ${ticket.priority}`,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
    }));
  }

  private async getRecentMilestones(organizationId: string, limit: number) {
    const milestones = await this.multiTenantPrisma.milestone.findMany({
      where: {
        project: {
          organizationId,
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return milestones.map((milestone) => ({
      id: milestone.id,
      type: 'milestone' as const,
      title: milestone.title,
      description: 'Milestone',
      status: milestone.status,
      createdAt: milestone.createdAt,
      dueDate: milestone.dueAt || undefined,
    }));
  }

  private async getRecentInvoices(organizationId: string, limit: number) {
    const invoices = await this.multiTenantPrisma.invoice.findMany({
      where: { organizationId },
      select: {
        id: true,
        status: true,
        amount: true,
        dueAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      type: 'invoice' as const,
      title: `Invoice ${invoice.id.slice(-8)}`,
      description: 'Invoice',
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueAt,
    }));
  }
}
