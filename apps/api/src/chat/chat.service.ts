import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

export interface CreateChatRoomDto {
  name: string;
  type: string; // 'direct', 'project', 'team'
  organizationId: string;
  projectId?: string;
}

export interface SendMessageDto {
  roomId: string;
  senderId: string;
  content: string;
  type?: string; // 'text', 'file', 'image', etc.
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createChatRoom(createChatRoomDto: CreateChatRoomDto) {
    const room = await this.prisma.chatRoom.create({
      data: {
        name: createChatRoomDto.name,
        type: createChatRoomDto.type,
        organizationId: createChatRoomDto.organizationId,
        projectId: createChatRoomDto.projectId,
      },
    });

    // Add the creator to the room as a member
    if (createChatRoomDto.type === 'direct') {
      // For direct messages, we'll add both users when they first message each other
    } else {
      // For project or team rooms, we could add all project members
      // This would be done in a more complete implementation
    }

    return room;
  }

  async getChatRooms(organizationId: string, userId: string) {
    // Get all rooms where the user is a member
    return await this.prisma.chatRoomMember.findMany({
      where: {
        userId,
        room: {
          organizationId,
        },
      },
      include: {
        room: true,
      },
    });
  }

  async getRoomMessages(roomId: string, userId: string, limit: number = 50, offset: number = 0) {
    // Verify user is a member of the room
    const membership = await this.prisma.chatRoomMember.findFirst({
      where: {
        roomId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this room');
    }

    return await this.prisma.message.findMany({
      where: {
        roomId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async sendMessage(sendMessageDto: SendMessageDto) {
    // Verify user is a member of the room
    const membership = await this.prisma.chatRoomMember.findFirst({
      where: {
        roomId: sendMessageDto.roomId,
        userId: sendMessageDto.senderId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this room');
    }

    const message = await this.prisma.message.create({
      data: {
        roomId: sendMessageDto.roomId,
        senderId: sendMessageDto.senderId,
        content: sendMessageDto.content,
        type: sendMessageDto.type || 'text',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    // Emit the message to all room members via WebSocket
    this.notificationsGateway.server.to(`room_${sendMessageDto.roomId}`).emit('message', message);

    return message;
  }

  async joinRoom(roomId: string, userId: string) {
    // Check if user is already a member
    const existingMembership = await this.prisma.chatRoomMember.findFirst({
      where: {
        roomId,
        userId,
      },
    });

    if (existingMembership) {
      return existingMembership; // Already a member
    }

    // Create membership
    const membership = await this.prisma.chatRoomMember.create({
      data: {
        roomId,
        userId,
      },
    });

    // Add user to the room's socket.io namespace
    // This would be handled by the gateway when the user connects
    // For now, we'll just log it
    this.logger.log(`User ${userId} joined room ${roomId}`);

    return membership;
  }

  async createDirectMessageRoom(user1Id: string, user2Id: string, organizationId: string) {
    // Check if a direct message room already exists between these users
    const existingRoom = await this.prisma.chatRoom.findFirst({
      where: {
        type: 'direct',
        organizationId,
        ChatRoomMember: {
          some: {
            userId: user1Id,
          },
        },
      },
    });

    if (existingRoom) {
      // Check if the other user is also a member
      const membership = await this.prisma.chatRoomMember.findFirst({
        where: {
          roomId: existingRoom.id,
          userId: user2Id,
        },
      });

      if (membership) {
        return existingRoom; // Room already exists with both users
      }
    }

    // Create a new direct message room
    const room = await this.prisma.chatRoom.create({
      data: {
        name: `DM between ${user1Id} and ${user2Id}`,
        type: 'direct',
        organizationId,
      },
    });

    // Add both users to the room
    await this.prisma.chatRoomMember.createMany({
      data: [
        { roomId: room.id, userId: user1Id },
        { roomId: room.id, userId: user2Id },
      ],
    });

    return room;
  }

  async markMessageAsRead(messageId: string, userId: string) {
    // Add the user to the readBy array if not already there
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user is already in readBy array
    if (message.readBy && message.readBy.includes(userId)) {
      return message; // Already marked as read by this user
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        readBy: message.readBy ? [...message.readBy, userId] : [userId],
      },
    });

    return updatedMessage;
  }

  async searchMessages(roomId: string, query: string, userId: string) {
    // Verify user is a member of the room
    const membership = await this.prisma.chatRoomMember.findFirst({
      where: {
        roomId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this room');
    }

    return await this.prisma.message.findMany({
      where: {
        roomId,
        content: {
          contains: query,
          mode: 'insensitive', // Case insensitive search
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit search results
    });
  }
}