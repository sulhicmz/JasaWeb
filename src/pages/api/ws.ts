import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';

import { UserRole, webSocketService } from '@/services/shared/WebSocketService';

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const wsToken = cookies.get('jasaweb_ws_token')?.value;

    if (!wsToken) {
      return errorResponse('Authentication required', 401);
    }

    const decoded = await verifyWebSocketToken(wsToken, locals.runtime.env.JWT_SECRET);
    
    if (!decoded) {
      return errorResponse('Invalid WebSocket token', 401);
    }

    const connectionId = decoded.connectionId as string;

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (data: any) => {
          const event = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        sendEvent({
          type: 'connection_status',
          payload: { status: 'connected', connectionId },
          timestamp: Date.now(),
          id: generateEventId()
        });

        const heartbeatInterval = setInterval(() => {
          sendEvent({
            type: 'heartbeat',
            payload: { timestamp: Date.now() },
            timestamp: Date.now(),
            id: generateEventId()
          });
        }, 30000);

        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          webSocketService.disconnect(locals, connectionId).catch(console.error);
          controller.close();
        });
      }
    });

    return new Response(stream, { headers });
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const wsToken = cookies.get('jasaweb_ws_token')?.value;

    if (!wsToken) {
      return errorResponse('Authentication required', 401);
    }

    const decoded = await verifyWebSocketToken(wsToken, locals.runtime.env.JWT_SECRET);
    
    if (!decoded) {
      return errorResponse('Invalid WebSocket token', 401);
    }

    const connectionId = decoded.connectionId as string;
    const userId = decoded.userId as string;
    const role = decoded.role as UserRole;

    const message = await request.json();
    
    const messageSize = JSON.stringify(message).length;
    if (messageSize > 65536) {
      return errorResponse('Message too large. Maximum size is 64KB.', 413);
    }

    await handleWebSocketMessage(message, connectionId, userId, role, locals);

    return jsonResponse({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};

async function verifyWebSocketToken(token: string, secret: string) {
  try {
    const { jwtVerify } = await import('jose');
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    
    if (payload.type !== 'websocket') {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

async function handleWebSocketMessage(
  message: any,
  connectionId: string,
  userId: string,
  role: UserRole,
  locals: any
) {
  const { type, payload, roomId } = message;

  switch (type) {
    case 'join_room':
      if (roomId) {
        await webSocketService.joinRoom(locals, connectionId, roomId);
      }
      break;

    case 'leave_room':
      if (roomId) {
        await webSocketService.leaveRoom(locals, connectionId, roomId);
      }
      break;

    case 'heartbeat':
      await webSocketService.heartbeat(locals, connectionId);
      break;

    case 'admin_broadcast':
      if (role === UserRole.ADMIN) {
        await webSocketService.broadcast(locals, {
          type: 'admin_broadcast',
          payload,
          timestamp: Date.now(),
          id: generateEventId(),
          userId
        }, roomId);
      }
      break;

    default:
      // Unknown WebSocket message type received - no action needed
  }
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}