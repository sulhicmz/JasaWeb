import type { AuditAction } from '@/lib/audit';
import { createAuditService } from '@/lib/audit';
import { getPrisma } from '@/lib/prisma';

export interface AuditMiddlewareOptions {
  action: AuditAction;
  resource: string;
  resourceIdParam?: string;
  logChanges?: boolean;
}

export function withAudit(
  options: AuditMiddlewareOptions
) {
  return async (
    context: { request: Request; locals: App.Locals },
    handler: (context: { request: Request; locals: App.Locals }) => Promise<Response>,
    beforeState?: any,
    afterState?: any
  ): Promise<Response> => {
    const { request, locals } = context;
    const user = locals.user;

    // Only log admin actions
    if (!user || user.role !== 'admin') {
      return handler(context);
    }

    try {
      const response = await handler(context);

      // Only log successful operations
      if (response.ok) {
        const auditService = createAuditService(getPrisma(locals));
        
        // Extract resource ID from URL params if specified
        let resourceId: string | undefined;
        if (options.resourceIdParam) {
          const url = new URL(request.url);
          const pathParts = url.pathname.split('/');
          resourceId = pathParts[pathParts.indexOf(options.resourceIdParam) + 1];
        }

        // Log changes if requested
        const logData: any = {
          userId: user.id,
          action: options.action,
          resource: options.resource,
          resourceId,
        };

        if (options.logChanges && beforeState && afterState) {
          // Simple diff implementation - in production, you might want a more sophisticated diff
          logData.oldValues = beforeState;
          logData.newValues = afterState;
        }

        await auditService.logWithRequest(logData, request);
      }

      return response;
    } catch (error) {
      console.error('Audit middleware error:', error);
      throw error; // Re-throw to maintain original error behavior
    }
  };
}

// Specific helper for GET operations (viewing sensitive data)
// Note: auditView decorator removed as decorators are not fully supported in this setup
// Use the AuditLogger.logAdminAction helper instead

// Helper function to audit common admin operations
export class AuditLogger {
  static async logAuth(locals: App.Locals, request: Request, action: 'LOGIN' | 'LOGOUT' | 'VIEW') {
    const user = locals.user;
    if (user?.role === 'admin') {
      const auditService = createAuditService(getPrisma(locals));
      await auditService.logWithRequest({
        userId: user.id,
        action,
        resource: 'auth',
      }, request);
    }
  }

  static async logAdminAction(locals: App.Locals, request: Request, data: {
    action: AuditAction;
    resource: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    const user = locals.user;
    if (user?.role === 'admin') {
      const auditService = createAuditService(getPrisma(locals));
      await auditService.logWithRequest({
        userId: user.id,
        ...data,
      }, request);
    }
  }

  static async logPayment(locals: App.Locals, request: Request, data: {
    action: 'PAYMENT_INIT' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    const user = locals.user;
    if (user) {
      const auditService = createAuditService(getPrisma(locals));
      await auditService.logWithRequest({
        userId: user.id,
        action: data.action,
        resource: 'payment',
        resourceId: data.resourceId,
        oldValues: data.oldValues,
        newValues: data.newValues,
      }, request);
    }
  }
}