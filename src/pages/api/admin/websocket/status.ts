import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { validateAdminAccess } from '@/services/admin/auth';
import { UserRole, webSocketService } from '@/services/shared/WebSocketService';
import { AuditLogger } from '@/lib/audit-middleware';

export const GET: APIRoute = async (context) => {
  try {
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    const url = new URL(context.request.url);
    const filter = url.searchParams.get('filter');
    const connections = await webSocketService.getConnections(context, filter ? { role: filter as UserRole } : undefined);
    const rooms = await webSocketService.getRooms(context);

    const stats = {
      totalConnections: connections.length,
      activeConnections: connections.filter(conn => conn.isAlive).length,
      connectionsByRole: {
        admin: connections.filter(conn => conn.role === 'admin').length,
        client: connections.filter(conn => conn.role === 'client').length
      },
      totalRooms: rooms.length,
      connections: connections.map(conn => ({
        id: conn.connectionId,
        userId: conn.userId,
        userName: (conn as any).user?.name,
        userRole: conn.role,
        connectedAt: conn.connectedAt,
        lastActivity: conn.lastActivity,
        isAlive: conn.isAlive,
        ipAddress: conn.ipAddress,
        rooms: conn.rooms
      })),
      rooms: rooms.map(room => ({
        name: room,
        memberCount: connections.filter(conn => conn.rooms.includes(room)).length
      }))
    };

    await AuditLogger.logAdminAction(context.locals, context.request, {
      action: 'VIEW',
      resource: 'websocket_status'
    });

    return jsonResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const authValidation = validateAdminAccess(context);
    if (!authValidation.isAuthorized) {
      return authValidation.response!;
    }

    const url = new URL(context.request.url);
    const connectionId = url.searchParams.get('connectionId');
    
    if (!connectionId) {
      return errorResponse('Connection ID is required');
    }

    await webSocketService.disconnect(context, connectionId);

    await AuditLogger.logAdminAction(context.locals, context.request, {
      action: 'DELETE',
      resource: 'websocket_connection',
      resourceId: connectionId || undefined
    });

    return jsonResponse({ success: true, message: 'Connection disconnected successfully' });
  } catch (error) {
    return handleApiError(error);
  }
};