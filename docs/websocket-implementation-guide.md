# WebSocket Implementation Guide

This guide provides step-by-step instructions for implementing the WebSocket real-time communication feature in JasaWeb.

## Quick Start

### 1. Database Schema Updates

First, add the new tables to your Prisma schema:

```prisma
// Add to prisma/schema.prisma

// ============================================
// WEBSOCKET CONNECTIONS
// ============================================
model WebSocketConnection {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  connectionId String   @unique @map("connection_id")
  clientIp     String?  @map("client_ip")
  userAgent    String?  @map("user_agent")
  connectedAt  DateTime @default(now()) @map("connected_at")
  lastActivity DateTime @default(now()) @map("last_activity")
  status       ConnectionStatus @default(active)
  
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages     WebSocketMessage[]
  
  @@map("websocket_connections")
  @@index([userId])
  @@index([connectionId])
  @@index([status])
  @@index([lastActivity])
  @@index([clientIp])
}

// ============================================
// WEBSOCKET MESSAGES
// ============================================
model WebSocketMessage {
  id           String   @id @default(uuid())
  connectionId String   @map("connection_id")
  messageType  String   @map("message_type")
  payload      Json
  sentAt       DateTime @default(now()) @map("sent_at")
  delivered    Boolean  @default(false)
  
  connection   WebSocketConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  @@map("websocket_messages")
  @@index([connectionId])
  @@index([messageType])
  @@index([sentAt])
  @@index([delivered])
}

// ============================================
// REAL-TIME NOTIFICATIONS
// ============================================
model RealTimeNotification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  type      NotificationType
  title     String
  message   String
  data      Json?
  readAt    DateTime? @map("read_at")
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("real_time_notifications")
  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@index([userId, readAt])
}

enum ConnectionStatus {
  active
  disconnected
  error
  timeout
}

enum NotificationType {
  project_update
  payment_update
  system_announcement
  admin_alert
  user_message
}
```

Then run:
```bash
pnpm db:push
pnpm db:generate
```

### 2. Create WebSocket Service

```typescript
// src/services/shared/WebSocketService.ts

interface WebSocketMessage {
  type: 'project_update' | 'payment_update' | 'system_announcement' | 'admin_alert' | 'user_message';
  data: any;
  timestamp: string;
  id: string;
}

export class WebSocketService {
  private connections = new Map<string, WebSocket>();
  private userConnections = new Map<string, Set<string>>();

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(ws: WebSocket, request: Request): Promise<void> {
    try {
      // Get auth token from query param or header
      const url = new URL(request.url);
      const token = url.searchParams.get('token') || url.searchParams.get('jwt');
      
      // Validate token
      const session = await this.validateToken(token);
      if (!session) {
        ws.close(1008, 'Invalid authentication');
        return;
      }

      // Generate unique connection ID
      const connectionId = crypto.randomUUID();
      
      // Store connection
      this.connections.set(connectionId, ws);
      
      // Track user connections
      if (!this.userConnections.has(session.id)) {
        this.userConnections.set(session.id, new Set());
      }
      this.userConnections.get(session.id)?.add(connectionId);

      // Setup message handlers
      ws.addEventListener('message', (event) => {
        this.handleMessage(connectionId, event, session);
      });

      ws.addEventListener('close', () => {
        this.handleDisconnect(connectionId, session.id);
      });

      // Send welcome message
      this.sendMessage(connectionId, {
        type: 'system_announcement',
        data: {
          title: 'Connected',
          message: 'Real-time updates are now active',
          priority: 'low'
        },
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Send message to specific connection
   */
  async sendMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
    const ws = this.connections.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify(message));
  }

  /**
   * Broadcast to all user's connections
   */
  async broadcastToUser(userId: string, message: WebSocketMessage): Promise<void> {
    const userConnIds = this.userConnections.get(userId);
    if (!userConnIds) return;

    for (const connId of userConnIds) {
      await this.sendMessage(connId, message);
    }
  }

  /**
   * Broadcast to all admin connections
   */
  async broadcastToAdmins(message: WebSocketMessage): Promise<void> {
    // This would query for admin users and broadcast to their connections
    // Implementation depends on your existing auth system
    console.log('Broadcasting to admins:', message);
  }

  /**
   * Validate WebSocket token
   */
  private async validateToken(token: string | null): Promise<UserSession | null> {
    if (!token) return null;

    try {
      // Reuse existing JWT verification
      return await verifyJWT(token);
    } catch {
      return null;
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(connectionId: string, event: MessageEvent, session: UserSession): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Basic validation
      if (!message.type || !message.data) {
        throw new Error('Invalid message format');
      }

      // Process based on message type
      switch (message.type) {
        case 'project_update':
          // Only admins can send project updates
          if (session.role === 'admin') {
            this.handleProjectUpdate(message, connectionId);
          }
          break;
        
        case 'system_announcement':
          // Only admins can send announcements
          if (session.role === 'admin') {
            this.broadcastToAdmins(message);
          }
          break;
        
        default:
          console.warn('Unhandled message type:', message.type);
      }

    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(connectionId: string, userId: string): void {
    // Remove from active connections
    this.connections.delete(connectionId);
    
    // Remove from user connections
    const userConns = this.userConnections.get(userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  /**
   * Handle project update messages
   */
  private async handleProjectUpdate(message: WebSocketMessage, connectionId: string): Promise<void> {
    const { projectId, newStatus } = message.data;
    
    if (!projectId || !newStatus) return;

    // Get project to find owner
    const project = await getProjectById(projectId);
    if (!project) return;

    // Broadcast to project owner
    await this.broadcastToUser(project.userId, {
      type: 'project_update',
      data: {
        projectId,
        projectName: project.name,
        oldStatus: project.status,
        newStatus,
        message: `Project "${project.name}" status updated to ${newStatus}`
      },
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    });
  }
}
```

### 3. WebSocket Authentication API

```typescript
// src/pages/api/websocket/token.ts

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const userId = locals.session?.id;
    if (!userId) {
      return errorResponse('Authentication required', 401);
    }

    // Generate temporary WebSocket token
    const token = await generateTemporalToken(userId, 'websocket', 300); // 5 minutes
    
    // Determine WebSocket URL
    const host = request.headers.get('host');
    const protocol = request.url.startsWith('https') ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${host}/ws`;

    return jsonResponse({
      token,
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      connectionUrl: wsUrl
    });

  } catch (error) {
    return handleApiError(error);
  }
};
```

### 4. WebSocket Handler for Astro

```typescript
// src/pages/api/ws.ts

// Cloudflare Workers-compatible WebSocket handling
const wsService = new WebSocketService();

export async function GET({ request }: APIContext): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Upgrade required', { status: 426 });
  }

  // Handle WebSocket upgrade
  return new Response(null, {
    status: 101,
    webSocket: {
      accept: () => {
        // Accept and handle connection
        wsService.handleConnection(webSocket, request);
      }
    }
  });
}
```

### 5. Client-Side WebSocket Hook

```typescript
// src/hooks/useWebSocket.ts
import { useState, useEffect, useRef } from 'react';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Function to connect
    const connect = async () => {
      try {
        // Get auth token
        const response = await fetch('/api/websocket/token', { method: 'POST' });
        const { token, connectionUrl } = await response.json();

        // Create WebSocket connection
        ws.current = new WebSocket(`${connectionUrl}?token=${token}`);

        ws.current.onopen = () => {
          setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
          const message = JSON.parse(event.data);
          setMessages(prev => [...prev, message]);

          // Handle specific message types
          switch (message.type) {
            case 'project_update':
              // Update UI based on project status change
              console.log('Project updated:', message.data);
              break;
            
            case 'payment_update':
              // Update payment status in UI
              console.log('Payment updated:', message.data);
              break;
            
            case 'system_announcement':
              // Show notification banner
              console.log('System announcement:', message.data);
              break;
          }
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          // Auto-reconnect after 5 seconds
          setTimeout(connect, 5000);
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (error) {
        console.error('Failed to connect:', error);
      }
    };

    connect();

    // Cleanup
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      }));
    }
  };

  return {
    isConnected,
    messages,
    sendMessage
  };
}
```

### 6. Integration with Existing Services

```typescript
// Example: Update ProjectService to send WebSocket notifications

// In src/services/domain/project.ts

export class ProjectService {
  private static wsService = new WebSocketService();

  static async updateProjectStatus(
    projectId: string,
    newStatus: ProjectStatus,
    updatedBy: string
  ): Promise<Project> {
    // Get current project
    const project = await getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Update in database
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // Send WebSocket notification
    await this.wsService.broadcastToUser(project.userId, {
      type: 'project_update',
      data: {
        projectId,
        projectName: project.name,
        oldStatus: project.status,
        newStatus,
        message: `Project "${project.name}" status updated to ${newStatus}`
      },
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    });

    // Send admin alert
    await this.wsService.broadcastToAdmins({
      type: 'admin_alert',
      data: {
        event: 'project_status_change',
        message: `Project "${project.name}" status changed to ${newStatus} by ${updatedBy}`,
        projectId,
        requiresAction: false
      },
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    });

    return updatedProject;
  }
}
```

### 7. Update Payment Service

```typescript
// In src/services/client/InvoiceService.ts

export class InvoiceService {
  private static wsService = new WebSocketService();

  static async processPaymentSuccess(invoiceId: string): Promise<Invoice> {
    // Update invoice status
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paidAt: new Date()
      },
      include: {
        project: true
      }
    });

    // Send WebSocket notification to project owner
    await this.wsService.broadcastToUser(invoice.project.userId, {
      type: 'payment_update',
      data: {
        invoiceId,
        projectId: invoice.project.id,
        projectName: invoice.project.name,
        amount: Number(invoice.amount),
        status: 'paid',
        paidAt: invoice.paidAt?.toISOString()
      },
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    });

    return invoice;
  }
}
```

### 8. Add Real-Time Updates to Dashboard

```typescript
// In src/pages/client/dashboard.astro

---

import DashboardLayout from '@/layouts/DashboardLayout.astro';
import { useWebSocket } from '@/hooks/useWebSocket';

// Rest of your existing dashboard code...

---

<script>
  import { useWebSocket } from '@/hooks/useWebSocket';

  const { isConnected, messages } = useWebSocket();

  // Listen for project updates
  useEffect(() => {
    const projectUpdate = messages.find(m => m.type === 'project_update');
    if (projectUpdate) {
      // Refresh project data
      window.location.reload();
    }

    const paymentUpdate = messages.find(m => m.type === 'payment_update');
    if (paymentUpdate) {
      // Update payment status in UI
      updatePaymentStatus(paymentUpdate.data);
    }
  }, [messages]);

  function updatePaymentStatus(data: any) {
    // Update payment status in the UI without full page reload
    const paymentElement = document.querySelector(`[data-invoice-id="${data.invoiceId}"]`);
    if (paymentElement) {
      paymentElement.querySelector('.status-badge').textContent = 'Paid';
      paymentElement.querySelector('.status-badge').className = 'status-badge status-paid';
    }
  }

  // Show connection status
  if (isConnected) {
    document.querySelector('.connection-status')?.classList.add('connected');
  }
</script>

<style>
  .connection-status {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 8px 16px;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .connection-status.connected::before {
    content: '';
    width: 8px;
    height: 8px;
    background: var(--color-success);
    border-radius: 50%;
  }

  .connection-status:not(.connected)::before {
    content: '';
    width: 8px;
    height: 8px;
    background: var(--color-error);
    border-radius: 50%;
  }
</style>

<div class="connection-status">
  {isConnected ? 'Connected' : 'Connecting...'}
</div>

<!-- Rest of your dashboard HTML -->
```

## Testing

### Unit Test Example

```typescript
// src/services/shared/WebSocketService.test.ts

import { describe, it, expect, vi } from 'vitest';
import { WebSocketService } from './WebSocketService';

describe('WebSocketService', () => {
  it('should handle connection with valid token', async () => {
    const wsService = new WebSocketService();
    const mockWs = {
      readyState: WebSocket.OPEN,
      addEventListener: vi.fn(),
      send: vi.fn()
    };

    const mockRequest = new Request('ws://localhost:3000/ws?token=valid.token');
    const mockSession = { id: 'user1', email: 'test@example.com', role: 'client' };

    // Mock token validation
    vi.spyOn(wsService, 'validateToken').mockResolvedValue(mockSession);

    await wsService.handleConnection(mockWs as any, mockRequest);

    expect(mockWs.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('system_announcement')
    );
  });

  it('should reject connection with invalid token', async () => {
    const wsService = new WebSocketService();
    const mockWs = {
      close: vi.fn()
    };

    const mockRequest = new Request('ws://localhost:3000/ws?token=invalid');

    // Mock token validation failure
    vi.spyOn(wsService, 'validateToken').mockResolvedValue(null);

    await wsService.handleConnection(mockWs as any, mockRequest);

    expect(mockWs.close).toHaveBeenCalledWith(1008, 'Invalid authentication');
  });
});
```

### Integration Test Example

```typescript
// tests/integration/websocket.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';

describe('WebSocket Integration', () => {
  let testUser: User;
  let wsToken: string;

  beforeAll(async () => {
    // Create test user and get WebSocket token
    testUser = await createTestUser();
    const response = await fetch('http://localhost:3000/api/websocket/token', {
      method: 'POST',
      headers: { 'Cookie': `auth_token=${testUser.authToken}` }
    });
    const { token } = await response.json();
    wsToken = token;
  });

  it('should connect and receive messages', async () => {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://localhost:3000/ws?token=${wsToken}`);

      ws.onopen = () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        expect(message.type).toBe('system_announcement');
        ws.close();
        resolve(undefined);
      };

      ws.onerror = (error) => {
        expect.fail(`WebSocket error: ${error}`);
      };
    });
  });
});
```

## Security Considerations

1. **Authentication**: Always validate JWT tokens
2. **Rate Limiting**: Implement connection and message rate limits
3. **Authorization**: Check user roles before processing messages
4. **Input Validation**: Validate all incoming message data
5. **HTTPS/WSS Only**: Never use unencrypted WebSocket connections

## Performance Tips

1. **Connection Pooling**: Reuse WebSocket connections
2. **Message Batching**: Batch multiple updates into single messages
3. **Compression**: Enable message compression for large payloads
4. **Cleanup**: Regularly clean up inactive connections

## Deployment Notes

For Cloudflare Workers deployment:

1. Use Durable Objects for stateful connections
2. Configure WebSocket upgrade handling
3. Set appropriate memory limits
4. Monitor connection counts and performance

This implementation provides a solid foundation for real-time communication in JasaWeb while maintaining the platform's architectural standards and security requirements.