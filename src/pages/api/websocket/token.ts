import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError, parseBody } from '@/lib/api';
import { AUTH_COOKIE, verifyToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { UserRole, webSocketService } from '@/services/shared/WebSocketService';
import { SignJWT } from 'jose';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const rateLimitError = await checkRateLimit(request, locals.runtime.env.KV as any, 'websocket_connect', { limit: 10, window: 60 });
    if (rateLimitError) {
      return rateLimitError;
    }

    const authCookie = cookies.get(AUTH_COOKIE)?.value;

    if (!authCookie) {
      return errorResponse('Authentication required', 401);
    }

    const user = await verifyToken(authCookie, locals.runtime.env.JWT_SECRET);
    
    if (!user) {
      return errorResponse('Invalid authentication', 401);
    }

    await parseBody(request);

    const result = await webSocketService.connect(locals, user.id, user.role as UserRole);

    if (!result.success) {
      return errorResponse(result.error || 'Failed to establish WebSocket connection', 500);
    }

    const secretKey = new TextEncoder().encode(locals.runtime.env.JWT_SECRET);
    const wsToken = await new SignJWT({
      userId: user.id,
      connectionId: result.connectionId,
      type: 'websocket',
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(secretKey);

    const response = jsonResponse({
      success: true,
      connectionId: result.connectionId,
      token: wsToken,
      expiresIn: 300
    });

    response.headers.set('Set-Cookie', `jasaweb_ws_token=${wsToken}; HttpOnly; SameSite=Strict; Secure; Path=/; Max-Age=300`);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
};