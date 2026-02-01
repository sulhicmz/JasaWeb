import type {
  WebSocketConnection,
  WebSocketEventType,
  PrismaClient
} from '@prisma/client';
import { getPrisma } from '@/lib/prisma';

export type WSMessage = {
  type: WebSocketEventType;
  payload: Record<string, any>;
  timestamp: number;
  id: string;
  userId?: string;
  roomId?: string;
};

export type ConnectionStatus = {
  success: boolean;
  connectionId: string;
  error?: string;
};

export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client'
}

export type { WebSocketEventType };
export interface IWebSocketService {
  connect(context: any, userId: string, role: UserRole): Promise<ConnectionStatus>;
  disconnect(context: any, connectionId: string): Promise<void>;
  heartbeat(context: any, connectionId: string): Promise<boolean>;
  broadcast(context: any, event: WSMessage, room?: string): Promise<void>;
  sendToUser(context: any, userId: string, event: WSMessage): Promise<void>;
  sendToRole(context: any, role: UserRole, event: WSMessage): Promise<void>;
  joinRoom(context: any, connectionId: string, room: string): Promise<void>;
  leaveRoom(context: any, connectionId: string, room: string): Promise<void>;
  getConnections(context: any, filter?: { userId?: string; role?: UserRole }): Promise<WebSocketConnection[]>;
  getRooms(context: any): Promise<string[]>;
}

export class WebSocketService implements IWebSocketService {
  private static instance: WebSocketService;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(context: any, userId: string, role: UserRole): Promise<ConnectionStatus> {
    const prisma = getPrisma(context);
    return this.handleConnect(prisma, userId, role);
  }

  disconnect(context: any, connectionId: string): Promise<void> {
    const prisma = getPrisma(context);
    return this.handleDisconnect(prisma, connectionId);
  }

  heartbeat(context: any, connectionId: string): Promise<boolean> {
    const prisma = getPrisma(context);
    return this.handleHeartbeat(prisma, connectionId);
  }

  broadcast(context: any, event: WSMessage, room?: string): Promise<void> {
    const prisma = getPrisma(context);
    return this.handleBroadcast(prisma, event, room);
  }

  sendToUser(context: any, userId: string, event: WSMessage): Promise<void> {
    const prisma = getPrisma(context);
    return this.handleSendToUser(prisma, userId, event);
  }

  sendToRole(context: any, role: UserRole, event: WSMessage): Promise<void> {
    const prisma = getPrisma(context);
    return this.handleSendToRole(prisma, role, event);
  }

  joinRoom(context: any, connectionId: string, room: string): Promise<void> {
    const prisma = getPrisma(context);
    return this.handleJoinRoom(prisma, connectionId, room);
  }

  leaveRoom(context: any, connectionId: string, room: string): Promise<void> {
    const prisma = getPrisma(context);
    return this.handleLeaveRoom(prisma, connectionId, room);
  }

  getConnections(context: any, filter?: { userId?: string; role?: UserRole }): Promise<WebSocketConnection[]> {
    const prisma = getPrisma(context);
    return this.handleGetConnections(prisma, filter);
  }

  getRooms(context: any): Promise<string[]> {
    const prisma = getPrisma(context);
    return this.handleGetRooms(prisma);
  }

  private async handleConnect(prisma: PrismaClient, userId: string, role: UserRole): Promise<ConnectionStatus> {
    try {
      const connectionId = this.generateConnectionId();
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        return { success: false, connectionId: '', error: 'User not found' };
      }

      await prisma.webSocketConnection.create({
        data: {
          userId,
          connectionId,
          role,
          ipAddress: '',
          userAgent: '',
        }
      });

      await this.sendToConnection(prisma, connectionId, {
        type: 'connection_status',
        payload: { status: 'connected', userId, connectionId },
        timestamp: Date.now(),
        id: this.generateEventId(),
      });

      return { success: true, connectionId };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return { 
        success: false, 
        connectionId: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async handleDisconnect(prisma: PrismaClient, connectionId: string): Promise<void> {
    try {
      const connection = await prisma.webSocketConnection.findUnique({
        where: { connectionId }
      });

      if (connection) {
        for (const room of connection.rooms) {
          await this.handleLeaveRoom(prisma, connectionId, room);
        }
      }

      await prisma.webSocketConnection.update({
        where: { connectionId },
        data: { 
          isAlive: false,
          lastActivity: new Date()
        }
      });
    } catch (error) {
      console.error('WebSocket disconnect error:', error);
    }
  }

  private async handleHeartbeat(prisma: PrismaClient, connectionId: string): Promise<boolean> {
    try {
      const updated = await prisma.webSocketConnection.updateMany({
        where: { connectionId, isAlive: true },
        data: { lastActivity: new Date() }
      });

      return updated.count > 0;
    } catch (error) {
      console.error('WebSocket heartbeat error:', error);
      return false;
    }
  }

  private async handleBroadcast(prisma: PrismaClient, event: WSMessage, room?: string): Promise<void> {
    try {
      let targetConnections: WebSocketConnection[] = [];

      if (room) {
        const roomMemberships = await prisma.webSocketRoomMembership.findMany({
          where: { roomId: room }
        });
        
        const connectionIds = roomMemberships.map(m => m.connectionId);
        targetConnections = await prisma.webSocketConnection.findMany({
          where: { 
            connectionId: { in: connectionIds },
            isAlive: true 
          }
        });
      } else {
        targetConnections = await prisma.webSocketConnection.findMany({
          where: { isAlive: true }
        });
      }

      await this.sendToConnections(prisma, targetConnections, event);

      await this.storeEvent(prisma, event, room);
    } catch (error) {
      console.error('WebSocket broadcast error:', error);
    }
  }

  private async handleSendToUser(prisma: PrismaClient, userId: string, event: WSMessage): Promise<void> {
    try {
      const connections = await prisma.webSocketConnection.findMany({
        where: { userId, isAlive: true }
      });

      await this.sendToConnections(prisma, connections, event);
    } catch (error) {
      console.error('WebSocket sendToUser error:', error);
    }
  }

  private async handleSendToRole(prisma: PrismaClient, role: UserRole, event: WSMessage): Promise<void> {
    try {
      const connections = await prisma.webSocketConnection.findMany({
        where: { role, isAlive: true }
      });

      await this.sendToConnections(prisma, connections, event);
    } catch (error) {
      console.error('WebSocket sendToRole error:', error);
    }
  }

  private async handleJoinRoom(prisma: PrismaClient, connectionId: string, room: string): Promise<void> {
    try {
      const connection = await prisma.webSocketConnection.findUnique({
        where: { connectionId }
      });

      if (!connection) return;

      await prisma.webSocketConnection.update({
        where: { connectionId },
        data: {
          rooms: [...connection.rooms.filter(r => r !== room), room]
        }
      });

      await prisma.webSocketRoomMembership.upsert({
        where: {
          connectionId_roomId: {
            connectionId,
            roomId: room
          }
        },
        update: {},
        create: {
          connectionId,
          roomId: room
        }
      });
    } catch (error) {
      console.error('WebSocket joinRoom error:', error);
    }
  }

  private async handleLeaveRoom(prisma: PrismaClient, connectionId: string, room: string): Promise<void> {
    try {
      const connection = await prisma.webSocketConnection.findUnique({
        where: { connectionId }
      });

      if (!connection) return;

      await prisma.webSocketConnection.update({
        where: { connectionId },
        data: {
          rooms: connection.rooms.filter(r => r !== room)
        }
      });

      await prisma.webSocketRoomMembership.deleteMany({
        where: { connectionId, roomId: room }
      });
    } catch (error) {
      console.error('WebSocket leaveRoom error:', error);
    }
  }

  private async handleGetConnections(prisma: PrismaClient, filter?: { userId?: string; role?: UserRole }): Promise<WebSocketConnection[]> {
    try {
      const whereClause: any = { isAlive: true };
      if (filter?.userId) whereClause.userId = filter.userId;
      if (filter?.role) whereClause.role = filter.role;

      return await prisma.webSocketConnection.findMany({
        where: whereClause,
        include: { user: true }
      });
    } catch (error) {
      console.error('WebSocket getConnections error:', error);
      return [];
    }
  }

  private async handleGetRooms(prisma: PrismaClient): Promise<string[]> {
    try {
      const rooms = await prisma.webSocketRoomMembership.findMany({
        distinct: ['roomId'],
        select: { roomId: true }
      });

      return rooms.map(r => r.roomId);
    } catch (error) {
      console.error('WebSocket getRooms error:', error);
      return [];
    }
  }

  private async storeEvent(prisma: PrismaClient, event: WSMessage, roomId?: string): Promise<void> {
    try {
      await prisma.webSocketEvent.create({
        data: {
          eventType: event.type,
          connectionId: '',
          roomId: roomId || null,
          payload: event.payload,
          isDelivered: false
        }
      });
    } catch (error) {
      console.error('WebSocket storeEvent error:', error);
    }
  }

  private async sendToConnections(prisma: PrismaClient, connections: WebSocketConnection[], event: WSMessage): Promise<void> {
    const messagePromises = connections.map(connection => 
      this.sendToConnection(prisma, connection.connectionId, event)
    );

    await Promise.allSettled(messagePromises);
  }

  private async sendToConnection(prisma: PrismaClient, connectionId: string, event: WSMessage): Promise<void> {
    try {
      await prisma.webSocketMessageQueue.create({
        data: {
          connectionId,
          eventType: event.type,
          payload: event.payload,
          priority: this.getEventPriority(event.type),
          expiresAt: new Date(Date.now() + 300000)
        }
      });

      await prisma.webSocketEvent.updateMany({
        where: { 
          connectionId,
          eventType: event.type,
          isDelivered: false
        },
        data: { 
          deliveredAt: new Date(),
          isDelivered: true
        }
      });
    } catch (error) {
      console.error('WebSocket sendToConnection error:', error);
    }
  }

  private getEventPriority(eventType: WebSocketEventType): number {
    const priorities: Record<WebSocketEventType, number> = {
      connection_status: 10,
      system_alert: 9,
      admin_broadcast: 8,
      payment_received: 7,
      project_update: 6,
      heartbeat: 1
    };

    return priorities[eventType] || 5;
  }

  private generateConnectionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  async cleanup(context: any): Promise<void> {
    try {
      const prisma = getPrisma(context);
      const fiveMinutesAgo = new Date(Date.now() - 300000);
      
      await prisma.webSocketConnection.updateMany({
        where: {
          isAlive: true,
          lastActivity: { lt: fiveMinutesAgo }
        },
        data: { isAlive: false }
      });

      await prisma.webSocketMessageQueue.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      const oneDayAgo = new Date(Date.now() - 86400000);
      await prisma.webSocketEvent.deleteMany({
        where: {
          createdAt: { lt: oneDayAgo }
        }
      });
    } catch (error) {
      console.error('WebSocket cleanup error:', error);
    }
  }
}

export const webSocketService = WebSocketService.getInstance();