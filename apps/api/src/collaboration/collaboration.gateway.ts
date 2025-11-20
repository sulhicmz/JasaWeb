import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CollaborationService } from './collaboration.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/users.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:4321',
    credentials: true,
  },
  namespace: 'collaboration',
})
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('CollaborationGateway');

  constructor(
    private readonly collaborationService: CollaborationService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  afterInit(server: Server) {
    this.logger.log('Collaboration WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate user from JWT token
      const token = client.handshake.auth.token;
      if (!token) {
        throw new WsException('Unauthorized');
      }

      const payload = this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new WsException('User not found');
      }

      client.user = {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      };

      // Join user to their organization room
      await client.join(`org_${user.organizationId}`);

      // Add user to online users
      await this.collaborationService.addUserToOnline(user.id, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        socketId: client.id,
      });

      // Notify others in organization about user coming online
      client.to(`org_${user.organizationId}`).emit('user_online', {
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      this.logger.log(`User ${user.email} connected to collaboration`);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      // Remove user from online users
      await this.collaborationService.removeUserFromOnline(client.user.id);

      // Notify others in organization about user going offline
      client.to(`org_${client.user.organizationId}`).emit('user_offline', {
        userId: client.user.id,
      });

      this.logger.log(
        `User ${client.user.email} disconnected from collaboration`
      );
    }
  }

  @SubscribeMessage('join_project')
  async handleJoinProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized');
    }

    // Join project room
    await client.join(`project_${data.projectId}`);

    // Add user to project participants
    await this.collaborationService.addUserToProject(
      client.user.id,
      data.projectId
    );

    // Notify others in project
    client.to(`project_${data.projectId}`).emit('user_joined_project', {
      projectId: data.projectId,
      user: {
        id: client.user.id,
        email: client.user.email,
        name: client.user.name,
      },
    });

    // Send current project state to user
    const projectState = await this.collaborationService.getProjectState(
      data.projectId
    );
    client.emit('project_state', projectState);

    return { success: true, projectId: data.projectId };
  }

  @SubscribeMessage('leave_project')
  async handleLeaveProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized');
    }

    // Leave project room
    await client.leave(`project_${data.projectId}`);

    // Remove user from project participants
    await this.collaborationService.removeUserFromProject(
      client.user.id,
      data.projectId
    );

    // Notify others in project
    client.to(`project_${data.projectId}`).emit('user_left_project', {
      projectId: data.projectId,
      userId: client.user.id,
    });

    return { success: true, projectId: data.projectId };
  }

  @SubscribeMessage('cursor_move')
  async handleCursorMove(
    @MessageBody()
    data: {
      projectId: string;
      documentId?: string;
      position: { x: number; y: number };
      selection?: { start: number; end: number };
    },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized');
    }

    // Broadcast cursor position to other users in the project
    client.to(`project_${data.projectId}`).emit('cursor_update', {
      userId: client.user.id,
      userName: client.user.name,
      position: data.position,
      selection: data.selection,
      documentId: data.documentId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @MessageBody()
    data: {
      projectId: string;
      documentId?: string;
    },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized');
    }

    // Broadcast typing indicator to other users
    client.to(`project_${data.projectId}`).emit('user_typing', {
      userId: client.user.id,
      userName: client.user.name,
      documentId: data.documentId,
      isTyping: true,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @MessageBody()
    data: {
      projectId: string;
      documentId?: string;
    },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized');
    }

    // Broadcast stop typing indicator
    client.to(`project_${data.projectId}`).emit('user_typing', {
      userId: client.user.id,
      userName: client.user.name,
      documentId: data.documentId,
      isTyping: false,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    data: {
      projectId: string;
      message: string;
      type: 'chat' | 'comment' | 'notification';
      recipientId?: string;
    },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized');
    }

    // Create message
    const message = await this.collaborationService.createMessage({
      senderId: client.user.id,
      projectId: data.projectId,
      content: data.message,
      type: data.type,
      recipientId: data.recipientId,
    });

    // Broadcast message to appropriate recipients
    if (data.recipientId) {
      // Direct message
      const recipientSocket = await this.collaborationService.getUserSocket(
        data.recipientId
      );
      if (recipientSocket) {
        this.server.to(recipientSocket).emit('new_message', message);
      }
    } else {
      // Project-wide message
      this.server.to(`project_${data.projectId}`).emit('new_message', message);
    }

    return { success: true, message };
  }

  @SubscribeMessage('document_edit')
  async handleDocumentEdit(
    @MessageBody()
    data: {
      projectId: string;
      documentId: string;
      operation: {
        type: 'insert' | 'delete' | 'retain';
        position: number;
        content?: string;
        length?: number;
      };
      version: number;
    },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.user) {
      throw new WsException('Unauthorized');
    }

    try {
      // Apply operational transformation
      const result = await this.collaborationService.applyDocumentEdit({
        documentId: data.documentId,
        operation: data.operation,
        version: data.version,
        userId: client.user.id,
      });

      // Broadcast edit to other users in the project
      client.to(`project_${data.projectId}`).emit('document_updated', {
        documentId: data.documentId,
        operation: data.operation,
        newVersion: result.newVersion,
        userId: client.user.id,
        timestamp: new Date().toISOString(),
      });

      return { success: true, newVersion: result.newVersion };
    } catch (error) {
      this.logger.error(`Document edit failed: ${error.message}`);
      client.emit('edit_error', {
        documentId: data.documentId,
        error: error.message,
      });
      throw new WsException('Edit operation failed');
    }
  }
}
