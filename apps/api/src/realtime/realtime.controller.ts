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
    @Res() response: Response,
    @CurrentOrganizationId() organizationId: string,
    @CurrentUserId() userId: string
  ) {
    // Set headers for Server-Sent Events
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const connectionId = `${organizationId}-${userId}`;
    this.connections.set(connectionId, response);

    // Send initial connection event
    response.write(
      `data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        connectionId,
      })}\n\n`
    );

    // Listen for events specific to this organization
    const eventListener = (data: any) => {
      if (data.targetOrganizationId === organizationId) {
        response.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    this.eventEmitter.on('broadcast', eventListener);

    // Clean up on disconnect
    response.on('close', () => {
      this.connections.delete(connectionId);
      this.eventEmitter.removeListener('broadcast', eventListener);
    });

    // Send periodic ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (this.connections.has(connectionId)) {
        response.write(
          `data: ${JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Ping every 30 seconds
  }

  private setupDatabaseListeners() {
    // Note: Prisma Client event listeners are not available in this version
    // This would be implemented with PostgreSQL LISTEN/NOTIFY or webhooks
    console.log('Database listeners setup - placeholder for real-time updates');
  }

  private broadcastEvent(
    type: string,
    payload: any,
    targetOrganizationId: string
  ) {
    const eventData = {
      type,
      payload,
      targetOrganizationId,
      timestamp: new Date().toISOString(),
    };

    this.eventEmitter.emit('broadcast', eventData);
  }

  @Get('test')
  @Roles(Role.OrgOwner, Role.OrgAdmin)
  async testRealtime(@CurrentOrganizationId() organizationId: string) {
    // Test endpoint to trigger a dashboard update
    this.broadcastEvent(
      'dashboard-update',
      {
        message: 'Test dashboard update',
        organizationId,
      },
      organizationId
    );

    return {
      message: 'Test event sent',
      organizationId,
      timestamp: new Date().toISOString(),
    };
  }
}
