import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
  sessionId?: string;
}

export interface SecurityEventEntry {
  eventType:
    | 'AUTHENTICATION'
    | 'AUTHORIZATION'
    | 'DATA_ACCESS'
    | 'DATA_MODIFICATION'
    | 'SYSTEM'
    | 'SECURITY_VIOLATION';
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent?: string;
  description: string;
  details?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  sessionId?: string;
}

@Injectable()
export class AuditLoggingService {
  private readonly logger = new Logger(AuditLoggingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logAuditEntry(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
      };

      // Sanitize sensitive data before logging
      const sanitizedEntry = this.sanitizeAuditData(auditEntry);

      // Store in database
      await this.prisma.auditLog.create({
        data: {
          userId: sanitizedEntry.userId,
          organizationId: sanitizedEntry.organizationId,
          action: sanitizedEntry.action,
          resource: sanitizedEntry.resource,
          resourceId: sanitizedEntry.resourceId,
          ipAddress: sanitizedEntry.ipAddress,
          userAgent: sanitizedEntry.userAgent,
          metadata: sanitizedEntry.details || {},
          severity: sanitizedEntry.severity,
          success: sanitizedEntry.success,
          errorMessage: sanitizedEntry.errorMessage,
          timestamp: sanitizedEntry.timestamp,
        },
      });

      // Log to application logger for immediate visibility
      this.logger.log(
        `AUDIT: ${entry.action} on ${entry.resource} ${
          entry.userId ? `by user ${entry.userId}` : ''
        }`
      );

      // Trigger alerts for critical events
      if (entry.severity === 'CRITICAL') {
        await this.triggerCriticalEventAlert(auditEntry);
      }
    } catch (error) {
      this.logger.error('Failed to log audit entry', error);
      // Fail gracefully to not interrupt application flow
    }
  }

  async logSecurityEvent(
    event: Omit<SecurityEventEntry, 'timestamp'>
  ): Promise<void> {
    try {
      const securityEvent: SecurityEventEntry = {
        ...event,
        timestamp: new Date(),
      };

      // Sanitize sensitive data
      const sanitizedEvent = this.sanitizeSecurityData(securityEvent);

      // Store in database
      await this.prisma.auditLog.create({
        data: {
          userId: sanitizedEvent.userId,
          organizationId: sanitizedEvent.organizationId,
          action: `SECURITY_EVENT_${sanitizedEvent.eventType}`,
          resource: 'SECURITY',
          ipAddress: sanitizedEvent.ipAddress,
          userAgent: sanitizedEvent.userAgent,
          metadata: {
            eventType: sanitizedEvent.eventType,
            description: sanitizedEvent.description,
            ...sanitizedEvent.details,
          },
          severity: sanitizedEvent.severity,
          success: true, // Security events are logged as successful logging operations
          timestamp: sanitizedEvent.timestamp,
        },
      });

      // Log to application logger
      this.logger.warn(
        `SECURITY EVENT: ${event.eventType} - ${event.description}`
      );

      // Trigger alerts for high and critical security events
      if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
        await this.triggerSecurityEventAlert(securityEvent);
      }
    } catch (error) {
      this.logger.error('Failed to log security event', error);
    }
  }

  async searchAuditLogs(filters: {
    userId?: string;
    organizationId?: string;
    action?: string;
    resource?: string;
    fromDate?: Date;
    toDate?: Date;
    severity?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ audits: any[]; total: number }> {
    try {
      const {
        userId,
        organizationId,
        action,
        resource,
        fromDate,
        toDate,
        severity,
        limit = 50,
        offset = 0,
      } = filters;

      const where: any = {};

      if (userId) where.userId = userId;
      if (organizationId) where.organizationId = organizationId;
      if (action) where.action = { contains: action, mode: 'insensitive' };
      if (resource)
        where.resource = { contains: resource, mode: 'insensitive' };
      if (severity) where.severity = severity;
      if (fromDate || toDate) {
        where.timestamp = {};
        if (fromDate) where.timestamp.gte = fromDate;
        if (toDate) where.timestamp.lte = toDate;
      }

      const [audits, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            userId: true,
            organizationId: true,
            action: true,
            resource: true,
            resourceId: true,
            ipAddress: true,
            userAgent: true,
            metadata: true,
            severity: true,
            success: true,
            errorMessage: true,
            timestamp: true,
          },
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      return { audits, total };
    } catch (error) {
      this.logger.error('Failed to search audit logs', error);
      throw new Error('Failed to search audit logs');
    }
  }

  private sanitizeAuditData(entry: AuditLogEntry): AuditLogEntry {
    if (!entry.details) return entry;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'ssn',
      'creditCard',
      'bankAccount',
    ];

    const sanitize = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveFields.some((field) => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitize(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      }

      return obj;
    };

    return {
      ...entry,
      details: sanitize(entry.details),
    };
  }

  private sanitizeSecurityData(event: SecurityEventEntry): SecurityEventEntry {
    return {
      ...event,
      details: event.details
        ? this.sanitizeAuditData({ details: event.details } as any).details
        : undefined,
    };
  }

  private async triggerCriticalEventAlert(entry: AuditLogEntry): Promise<void> {
    this.logger.error(
      `CRITICAL AUDIT EVENT: ${entry.action} on ${entry.resource}`,
      entry
    );

    // TODO: Implement alert mechanisms:
    // - Send notification to security team
    // - Create incident in incident management system
    // - Send SMS/push notification to on-call security
    // - Trigger webhook to external monitoring
  }

  private async triggerSecurityEventAlert(
    event: SecurityEventEntry
  ): Promise<void> {
    this.logger.warn(
      `HIGH SEVERITY SECURITY EVENT: ${event.eventType} - ${event.description}`,
      event
    );

    // TODO: Implement security alert mechanisms:
    // - Add to security dashboard
    // - Send to SIEM system
    // - Enable additional monitoring for affected user/IP
    // - Consider automated response (e.g., rate limiting, temporary block)
  }

  // Convenience methods for common audit operations

  async logUserLogin(
    userId: string,
    organizationId: string,
    ipAddress: string,
    userAgent?: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    return this.logAuditEntry({
      userId,
      organizationId,
      action: 'USER_LOGIN',
      resource: 'AUTHENTICATION',
      ipAddress,
      userAgent,
      success,
      errorMessage,
      severity: success ? 'LOW' : 'MEDIUM',
    });
  }

  async logDataAccess(
    userId: string,
    organizationId: string,
    resource: string,
    resourceId: string,
    ipAddress: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    return this.logAuditEntry({
      userId,
      organizationId,
      action: 'DATA_ACCESS',
      resource: resource.toUpperCase(),
      resourceId,
      ipAddress,
      userAgent,
      details,
      severity: 'LOW',
      success: true,
    });
  }

  async logDataModification(
    userId: string,
    organizationId: string,
    resource: string,
    resourceId: string,
    ipAddress: string,
    userAgent?: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    success: boolean,
    details?: Record<string, any>
  ): Promise<void> {
    return this.logAuditEntry({
      userId,
      organizationId,
      action: `DATA_${operation}`,
      resource: resource.toUpperCase(),
      resourceId,
      ipAddress,
      userAgent,
      details,
      success,
      severity: 'MEDIUM',
    });
  }

  async logSecurityViolation(
    organizationId: string,
    violationType: string,
    ipAddress: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    return this.logSecurityEvent({
      eventType: 'SECURITY_VIOLATION',
      organizationId,
      description: violationType,
      ipAddress,
      userAgent,
      details,
      severity: 'HIGH',
    });
  }
}
