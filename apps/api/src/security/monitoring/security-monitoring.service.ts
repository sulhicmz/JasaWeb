import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { AuditService } from '../../common/services/audit.service';

export interface SecurityEvent {
  type:
    | 'login_attempt'
    | 'mfa_verification'
    | 'password_change'
    | 'suspicious_activity'
    | 'data_access';
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
  riskScore: number; // 0-100
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId?: string;
  organizationId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  resolved: boolean;
}

export interface SecurityMetrics {
  totalEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
  uniqueIPs: number;
  riskScore: number;
  alertsCount: number;
  criticalAlerts: number;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);
  private readonly suspiciousPatterns = {
    multipleFailedLogins: 5, // threshold for failed login attempts
    unusualLocation: true, // flag for location-based anomalies
    bruteForce: 10, // threshold for rapid requests
  };

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  /**
   * Record a security event
   */
  async recordSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in database for analysis
      await this.prisma.securityEvent.create({
        data: {
          type: event.type,
          userId: event.userId,
          organizationId: event.organizationId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          success: event.success,
          details: event.details || {},
          riskScore: event.riskScore,
        },
      });

      // Check for suspicious patterns
      await this.analyzeSecurityEvent(event);

      this.logger.log(
        `Security event recorded: ${event.type} from ${event.ipAddress}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to record security event: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Analyze security event for suspicious patterns
   */
  private async analyzeSecurityEvent(event: SecurityEvent): Promise<void> {
    // Check for multiple failed logins
    if (event.type === 'login_attempt' && !event.success) {
      await this.checkMultipleFailedLogins(event.ipAddress, event.userId);
    }

    // Check for unusual access patterns
    if (event.type === 'data_access') {
      await this.checkUnusualAccessPatterns(event);
    }

    // Check for MFA verification failures
    if (event.type === 'mfa_verification' && !event.success) {
      await this.checkMfaAbuse(event.ipAddress, event.userId);
    }
  }

  /**
   * Check for multiple failed login attempts
   */
  private async checkMultipleFailedLogins(
    ipAddress: string,
    userId?: string
  ): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const failedAttempts = await this.prisma.securityEvent.count({
      where: {
        type: 'login_attempt',
        ipAddress,
        success: false,
        createdAt: { gte: oneHourAgo },
        ...(userId && { userId }),
      },
    });

    if (failedAttempts >= this.suspiciousPatterns.multipleFailedLogins) {
      await this.createSecurityAlert({
        type: 'multiple_failed_logins',
        severity: 'high',
        message: `Multiple failed login attempts detected from IP: ${ipAddress}`,
        userId,
        metadata: {
          ipAddress,
          failedAttempts,
          timeWindow: '1 hour',
        },
      });
    }
  }

  /**
   * Check for unusual data access patterns
   */
  private async checkUnusualAccessPatterns(
    event: SecurityEvent
  ): Promise<void> {
    if (!event.userId) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const accessCount = await this.prisma.securityEvent.count({
      where: {
        type: 'data_access',
        userId: event.userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    // Flag if user accesses unusual amount of data
    if (accessCount > 100) {
      // threshold for unusual activity
      await this.createSecurityAlert({
        type: 'unusual_data_access',
        severity: 'medium',
        message: `Unusual data access pattern detected for user`,
        userId: event.userId,
        organizationId: event.organizationId,
        metadata: {
          accessCount,
          timeWindow: '1 hour',
          ipAddress: event.ipAddress,
        },
      });
    }
  }

  /**
   * Check for MFA abuse
   */
  private async checkMfaAbuse(
    ipAddress: string,
    userId?: string
  ): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const failedMfaAttempts = await this.prisma.securityEvent.count({
      where: {
        type: 'mfa_verification',
        ipAddress,
        success: false,
        createdAt: { gte: fifteenMinutesAgo },
        ...(userId && { userId }),
      },
    });

    if (failedMfaAttempts >= 3) {
      await this.createSecurityAlert({
        type: 'mfa_abuse',
        severity: 'high',
        message: `Multiple MFA verification failures detected`,
        userId,
        metadata: {
          ipAddress,
          failedAttempts: failedMfaAttempts,
          timeWindow: '15 minutes',
        },
      });
    }
  }

  /**
   * Create security alert
   */
  private async createSecurityAlert(alertData: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    userId?: string;
    organizationId?: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      await this.prisma.securityAlert.create({
        data: {
          type: alertData.type,
          severity: alertData.severity,
          message: alertData.message,
          userId: alertData.userId,
          organizationId: alertData.organizationId,
          metadata: alertData.metadata,
          resolved: false,
        },
      });

      // Log to audit service
      if (alertData.userId) {
        await this.auditService.log({
          actorId: 'system',
          organizationId: alertData.organizationId || 'system',
          action: 'security_alert_created',
          target: 'SecurityAlert',
          targetId: alertData.type,
          meta: {
            alertType: alertData.type,
            severity: alertData.severity,
            userId: alertData.userId,
          },
        });
      }

      this.logger.warn(
        `Security alert created: ${alertData.type} - ${alertData.message}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to create security alert: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Get security metrics for dashboard
   */
  async getSecurityMetrics(organizationId?: string): Promise<SecurityMetrics> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const whereClause: any = {
      createdAt: { gte: twentyFourHoursAgo },
      ...(organizationId && { organizationId }),
    };

    const [
      totalEvents,
      failedLogins,
      suspiciousActivities,
      uniqueIPs,
      alertsCount,
      criticalAlerts,
    ] = await Promise.all([
      this.prisma.securityEvent.count({ where: whereClause }),
      this.prisma.securityEvent.count({
        where: {
          ...whereClause,
          type: 'login_attempt',
          success: false,
        },
      }),
      this.prisma.securityEvent.count({
        where: {
          ...whereClause,
          type: 'suspicious_activity',
        },
      }),
      this.prisma.securityEvent
        .findMany({
          where: whereClause,
          select: { ipAddress: true },
          distinct: ['ipAddress'],
        })
        .then((events) => events.length),
      this.prisma.securityAlert.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          ...(organizationId && { organizationId }),
          resolved: false,
        },
      }),
      this.prisma.securityAlert.count({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
          ...(organizationId && { organizationId }),
          severity: 'critical',
          resolved: false,
        },
      }),
    ]);

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore({
      totalEvents,
      failedLogins,
      suspiciousActivities,
      criticalAlerts,
    });

    return {
      totalEvents,
      failedLogins,
      suspiciousActivities,
      uniqueIPs,
      riskScore,
      alertsCount,
      criticalAlerts,
    };
  }

  /**
   * Get recent security alerts
   */
  async getRecentAlerts(
    organizationId?: string,
    limit: number = 50
  ): Promise<SecurityAlert[]> {
    const alerts = await this.prisma.securityAlert.findMany({
      where: {
        ...(organizationId && { organizationId }),
        resolved: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return alerts.map((alert) => ({
      ...alert,
      metadata: alert.metadata as Record<string, any>,
    }));
  }

  /**
   * Resolve security alert
   */
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await this.prisma.securityAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });

    this.logger.log(`Security alert ${alertId} resolved by ${resolvedBy}`);
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(metrics: {
    totalEvents: number;
    failedLogins: number;
    suspiciousActivities: number;
    criticalAlerts: number;
  }): number {
    let score = 0;

    // Base score on failed login ratio
    if (metrics.totalEvents > 0) {
      const failedLoginRatio = metrics.failedLogins / metrics.totalEvents;
      score += Math.min(failedLoginRatio * 30, 30);
    }

    // Add points for suspicious activities
    score += Math.min(metrics.suspiciousActivities * 10, 30);

    // Add points for critical alerts
    score += Math.min(metrics.criticalAlerts * 20, 40);

    return Math.min(Math.round(score), 100);
  }
}
