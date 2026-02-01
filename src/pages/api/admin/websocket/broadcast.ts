import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError, parseBody } from '@/lib/api';
import { validateAdminAccess } from '@/services/admin/auth';
import { UserRole, webSocketService } from '@/services/shared/WebSocketService';
import { realTimeNotificationService } from '@/services/domain/RealTimeNotificationService';
import { AuditLogger } from '@/lib/audit-middleware';

export const POST: APIRoute = async (context) => {
  try {
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    const body = await parseBody(context.request);
    
    if (!body) {
      return errorResponse('Request body is required');
    }

    const { message, target, roomId, priority = 'medium' } = body as {
  message?: string;
  target?: string;
  roomId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

    if (!message || typeof message !== 'string') {
      return errorResponse('Message is required and must be a string');
    }

    const adminUser = context.locals.user;

    let result;
    
    switch (target) {
      case 'all':
        await realTimeNotificationService.sendToAll(context, {
          type: 'system_announcement',
          title: 'System Announcement',
          message,
          priority,
          payload: { sentBy: adminUser?.name }
        });
        result = { sentTo: 'all_users', count: 0 };
        break;

      case 'admin':
        await realTimeNotificationService.sendByRole(context, UserRole.ADMIN, {
          type: 'admin_alert',
          title: 'Admin Alert',
          message,
          priority,
          payload: { sentBy: adminUser?.name }
        });
        result = { sentTo: 'admin_users', count: 0 };
        break;

      case 'client':
        await realTimeNotificationService.sendByRole(context, UserRole.CLIENT, {
          type: 'system_announcement',
          title: 'System Announcement',
          message,
          priority,
          payload: { sentBy: adminUser?.name }
        });
        result = { sentTo: 'client_users', count: 0 };
        break;

      case 'room':
        if (!roomId) {
          return errorResponse('Room ID is required when target is room');
        }
        
        await webSocketService.broadcast(context, {
          type: 'admin_broadcast',
          payload: { message, sentBy: adminUser?.name, roomId },
          timestamp: Date.now(),
          id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          userId: adminUser?.id
        }, roomId || '');
        
        result = { sentTo: `room_${roomId}`, count: 0 };
        break;

      default:
        return errorResponse('Invalid target. Must be: all, admin, client, or room');
    }

    await AuditLogger.logAdminAction(context.locals, context.request, {
      action: 'CREATE',
      resource: 'websocket_broadcast',
      newValues: { target, message, roomId, priority }
    });

    return jsonResponse({
      success: true,
      message: 'Broadcast sent successfully',
      ...result
    });
  } catch (error) {
    return handleApiError(error);
  }
};