import type { PrismaClient } from '@prisma/client';

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW'
  | 'PAYMENT_INIT'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'EXPORT'
  | 'IMPORT'
  | 'ROLE_CHANGE';

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private db: PrismaClient;

  constructor(db: PrismaClient) {
    this.db = db;
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const auditLog: any = {
        action: entry.action,
        resource: entry.resource,
        ipAddress: entry.ipAddress || 'unknown',
        userAgent: entry.userAgent || 'unknown',
      };

      if (entry.userId) auditLog.user = { connect: { id: entry.userId } };
      if (entry.resourceId) auditLog.resourceId = entry.resourceId;
      if (entry.oldValues) auditLog.oldValues = entry.oldValues;
      if (entry.newValues) auditLog.newValues = entry.newValues;

      await this.db.auditLog.create({
        data: auditLog,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should never break the main application flow
    }
  }

  async logWithRequest(
    entry: Omit<AuditLogEntry, 'ipAddress' | 'userAgent'>,
    request: Request
  ): Promise<void> {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('cf-connecting-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await this.log({
      ...entry,
      ipAddress: clientIP,
      userAgent,
    });
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        ...log,
        oldValues: log.oldValues ? (typeof log.oldValues === 'string' ? JSON.parse(log.oldValues) : log.oldValues) : null,
        newValues: log.newValues ? (typeof log.newValues === 'string' ? JSON.parse(log.newValues) : log.newValues) : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getAuditLogById(id: string) {
    const log = await this.db.auditLog.findUnique({
      where: { id },
    });

    if (!log) return null;

    return {
      ...log,
      oldValues: log.oldValues ? (typeof log.oldValues === 'string' ? JSON.parse(log.oldValues) : log.oldValues) : null,
      newValues: log.newValues ? (typeof log.newValues === 'string' ? JSON.parse(log.newValues) : log.newValues) : null,
    };
  }
}

export function createAuditService(db: PrismaClient): AuditService {
  return new AuditService(db);
}