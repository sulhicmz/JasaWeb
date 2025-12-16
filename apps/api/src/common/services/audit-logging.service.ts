import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type AuditLogDetails = Record<string, unknown>;

export interface AuditLogEntry {
  actorId?: string;
  organizationId?: string;
  action: string;
  target: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: AuditLogDetails;
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
  actorId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent?: string;
  description: string;
  details?: AuditLogDetails;
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
          ...(sanitizedEntry.actorId && { actorId: sanitizedEntry.actorId }),
          organizationId: sanitizedEntry.organizationId || '',
          action: sanitizedEntry.action,
          target: sanitizedEntry.target,
          meta: JSON.stringify({
            resourceId: sanitizedEntry.resourceId || null,
            ipAddress: sanitizedEntry.ipAddress,
            userAgent: sanitizedEntry.userAgent || null,
            details: sanitizedEntry.details || {},
            severity: sanitizedEntry.severity,
            success: sanitizedEntry.success,
            errorMessage: sanitizedEntry.errorMessage || null,
            sessionId: sanitizedEntry.sessionId || null,
          }),
          createdAt: sanitizedEntry.timestamp,
        },
      });

      // Log to application logger for immediate visibility
      this.logger.log(
        `AUDIT: ${entry.action} on ${entry.target} ${
          entry.actorId ? `by user ${entry.actorId}` : ''
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
          ...(sanitizedEvent.actorId && { actorId: sanitizedEvent.actorId }),
          organizationId: sanitizedEvent.organizationId || '',
          action: `SECURITY_EVENT_${sanitizedEvent.eventType}`,
          target: 'SECURITY',
          meta: JSON.stringify({
            ipAddress: sanitizedEvent.ipAddress,
            userAgent: sanitizedEvent.userAgent || null,
            eventType: sanitizedEvent.eventType,
            description: sanitizedEvent.description,
            ...(sanitizedEvent.details || {}),
            severity: sanitizedEvent.severity,
            success: true, // Security events are logged as successful logging operations
            sessionId: sanitizedEvent.sessionId || null,
          }),
          createdAt: sanitizedEvent.timestamp,
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
    actorId?: string;
    organizationId?: string;
    action?: string;
    target?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ audits: unknown[]; total: number }> {
    try {
      const {
        actorId,
        organizationId,
        action,
        target,
        fromDate,
        toDate,
        limit = 50,
        offset = 0,
      } = filters;

      const where: Record<string, unknown> = {};

      if (actorId) where.actorId = actorId;
      if (organizationId) where.organizationId = organizationId;
      if (action) where.action = { contains: action, mode: 'insensitive' };
      if (target) where.target = { contains: target, mode: 'insensitive' };
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) (where.createdAt as Record<string, Date>).gte = fromDate;
        if (toDate) (where.createdAt as Record<string, Date>).lte = toDate;
      }

      const [audits, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
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

    const sanitize = (obj: unknown): unknown => {
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }

      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const sanitized: Record<string, unknown> = {};
        const entries = Object.entries(obj as Record<string, unknown>);

        for (const [key, value] of entries) {
          if (typeof key === 'string') {
            const lowerKey = key.toLowerCase();
            const hasSensitiveField = sensitiveFields.some((field: string) =>
              lowerKey.includes(field)
            );

            if (hasSensitiveField) {
              sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
              sanitized[key] = sanitize(value);
            } else {
              sanitized[key] = value;
            }
          }
        }
        return sanitized;
      }

      return obj;
    };

    return {
      ...entry,
      details: sanitize(entry.details) as AuditLogDetails,
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
      `CRITICAL AUDIT EVENT: ${entry.action} on ${entry.target}`,
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
    actorId: string,
    organizationId: string,
    ipAddress: string,
    success: boolean,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    return this.logAuditEntry({
      actorId,
      organizationId,
      action: 'USER_LOGIN',
      target: 'AUTHENTICATION',
      ipAddress,
      userAgent,
      success,
      errorMessage,
      severity: success ? 'LOW' : 'MEDIUM',
    });
  }

  async logDataAccess(
    actorId: string,
    organizationId: string,
    target: string,
    resourceId: string,
    ipAddress: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    return this.logAuditEntry({
      actorId,
      organizationId,
      action: 'DATA_ACCESS',
      target: target.toUpperCase(),
      resourceId,
      ipAddress,
      userAgent,
      details,
      severity: 'LOW',
      success: true,
    });
  }

  async logDataModification(
    actorId: string,
    organizationId: string,
    target: string,
    resourceId: string,
    ipAddress: string,
    success: boolean,
    userAgent?: string,
    operation?: 'CREATE' | 'UPDATE' | 'DELETE',
    details?: Record<string, any>
  ): Promise<void> {
    return this.logAuditEntry({
      actorId,
      organizationId,
      action: `DATA_${operation}`,
      target: target.toUpperCase(),
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
