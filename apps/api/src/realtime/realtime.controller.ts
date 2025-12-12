import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { EventEmitter } from 'events';

@Controller('api/realtime')
@UseGuards(RolesGuard)
export class RealtimeController {
  private eventEmitter = new EventEmitter();
  private connections = new Map<string, Response>();

  constructor(private readonly multiTenantPrisma: MultiTenantPrismaService) {
    this.setupDatabaseListeners();
  }

  @Get('events')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Reviewer, Role.Member)
  async getEvents(
    @Res() res: Response,
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() userId: string
  ) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection event
    res.write(
      `data: ${JSON.stringify({
        type: 'connection',
        payload: { status: 'connected', organizationId, userId },
      })}\n\n`
    );

    // Store connection for this user
    const connectionId = `${organizationId}-${userId}`;
    this.connections.set(connectionId, res);

    // Send periodic ping to keep connection alive
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (error) {
        clearInterval(pingInterval);
        this.connections.delete(connectionId);
      }
    }, 30000); // 30 seconds

    // Handle client disconnect
    res.on('close', () => {
      clearInterval(pingInterval);
      this.connections.delete(connectionId);
    });

    // Listen for events and broadcast to relevant connections
    const eventHandler = (eventData: {
      type: string;
      payload: any;
      targetOrganizationId?: string;
    }) => {
      // Only send events for the user's organization
      if (
        !eventData.targetOrganizationId ||
        eventData.targetOrganizationId === organizationId
      ) {
        try {
          res.write(
            `data: ${JSON.stringify({
              type: eventData.type,
              payload: eventData.payload,
            })}\n\n`
          );
        } catch (error) {
          // Connection likely closed
          clearInterval(pingInterval);
          this.connections.delete(connectionId);
        }
      }
    };

    this.eventEmitter.on('broadcast', eventHandler);
  }

  private setupDatabaseListeners() {
    // Listen to Prisma events for real-time updates
    this.multiTenantPrisma.$on<any>('query', (event) => {
      // Only listen for mutations (create, update, delete)
      if (['create', 'update', 'delete'].includes(event.action)) {
        this.handleDatabaseEvent(event);
      }
    });
  }

  private handleDatabaseEvent(event: any) {
    const { model, action, args } = event;

    // Extract organization ID from the query
    const organizationId = this.extractOrganizationId(args);

    if (!organizationId) return;

    // Broadcast relevant events based on the model
    switch (model) {
      case 'Project':
        this.broadcastEvent(
          'project-update',
          {
            action,
            projectId: args?.data?.id || args?.where?.id,
            organizationId,
          },
          organizationId
        );
        break;

      case 'Ticket':
        this.broadcastEvent(
          'ticket-update',
          {
            action,
            ticketId: args?.data?.id || args?.where?.id,
            organizationId,
          },
          organizationId
        );
        break;

      case 'Invoice':
        this.broadcastEvent(
          'invoice-update',
          {
            action,
            invoiceId: args?.data?.id || args?.where?.id,
            organizationId,
          },
          organizationId
        );
        break;

      case 'Milestone':
        this.broadcastEvent(
          'milestone-update',
          {
            action,
            milestoneId: args?.data?.id || args?.where?.id,
            organizationId,
          },
          organizationId
        );
        break;
    }

    // Always broadcast dashboard update for any relevant change
    this.broadcastEvent(
      'dashboard-update',
      {
        model,
        action,
        organizationId,
        timestamp: new Date().toISOString(),
      },
      organizationId
    );
  }

  private extractOrganizationId(args: any): string | null {
    // Try to extract organization ID from various query locations
    if (args?.data?.organizationId) return args.data.organizationId;
    if (args?.where?.organizationId) return args.where.organizationId;
    if (args?.organizationId) return args.organizationId;

    return null;
  }

  private broadcastEvent(
    type: string,
    payload: any,
    targetOrganizationId: string
  ) {
    this.eventEmitter.emit('broadcast', {
      type,
      payload,
      targetOrganizationId,
    });
  }

  // Manual trigger method for testing or external events
  async triggerDashboardUpdate(organizationId: string) {
    this.broadcastEvent(
      'dashboard-update',
      {
        type: 'manual-refresh',
        organizationId,
        timestamp: new Date().toISOString(),
      },
      organizationId
    );
  }
}
