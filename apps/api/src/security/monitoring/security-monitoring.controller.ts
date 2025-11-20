import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  SecurityMonitoringService,
  SecurityAlert,
  SecurityMetrics,
} from './security-monitoring.service';

@ApiTags('Security Monitoring')
@Controller('security/monitoring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SecurityMonitoringController {
  constructor(private readonly securityService: SecurityMonitoringService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get security metrics for dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Security metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalEvents: { type: 'number' },
        failedLogins: { type: 'number' },
        suspiciousActivities: { type: 'number' },
        uniqueIPs: { type: 'number' },
        riskScore: { type: 'number' },
        alertsCount: { type: 'number' },
        criticalAlerts: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization',
  })
  async getSecurityMetrics(
    @Request() req,
    @Query('organizationId') organizationId?: string
  ): Promise<SecurityMetrics> {
    return this.securityService.getSecurityMetrics(organizationId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get recent security alerts' })
  @ApiResponse({
    status: 200,
    description: 'Security alerts retrieved successfully',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
        },
        message: { type: 'string' },
        userId: { type: 'string' },
        organizationId: { type: 'string' },
        metadata: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
        resolved: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Maximum number of alerts',
  })
  async getRecentAlerts(
    @Request() req,
    @Query('organizationId') organizationId?: string,
    @Query('limit') limit?: string
  ): Promise<SecurityAlert[]> {
    return this.securityService.getRecentAlerts(
      organizationId,
      limit ? parseInt(limit) : 50
    );
  }

  @Post('alerts/:alertId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a security alert' })
  @ApiResponse({
    status: 200,
    description: 'Security alert resolved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async resolveAlert(
    @Request() req,
    @Param('alertId') alertId: string
  ): Promise<{ message: string }> {
    await this.securityService.resolveAlert(alertId, req.user.id);
    return { message: 'Security alert resolved successfully' };
  }
}
