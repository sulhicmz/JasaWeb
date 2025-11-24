import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ChatService, CreateChatRoomDto, SendMessageDto } from './chat.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MultiTenantGuard } from '../common/guards/multi-tenant.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';

@Controller('chat')
@UseGuards(AuthGuard, MultiTenantGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  async createRoom(
    @CurrentOrganizationId() organizationId: string,
    @Body() createChatRoomDto: CreateChatRoomDto,
    @Request() req: any
  ) {
    // Only allow creating rooms within the user's organization
    if (createChatRoomDto.organizationId !== organizationId) {
      throw new Error('Invalid organization');
    }
    
    return await this.chatService.createChatRoom({
      ...createChatRoomDto,
      organizationId,
    });
  }

  @Get('rooms')
  async getRooms(
    @CurrentOrganizationId() organizationId: string,
    @Request() req: any
  ) {
    return await this.chatService.getChatRooms(organizationId, req.user.id);
  }

  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    
    return await this.chatService.getRoomMessages(roomId, req.user.id, limitNum, offsetNum);
  }

  @Post('rooms/:roomId/messages')
  async sendMessage(
    @Param('roomId') roomId: string,
    @Request() req: any,
    @Body() body: { content: string; type?: string }
  ) {
    const sendMessageDto: SendMessageDto = {
      roomId,
      senderId: req.user.id,
      content: body.content,
      type: body.type || 'text',
    };
    
    return await this.chatService.sendMessage(sendMessageDto);
  }

  @Post('rooms/:roomId/join')
  async joinRoom(
    @Param('roomId') roomId: string,
    @Request() req: any
  ) {
    return await this.chatService.joinRoom(roomId, req.user.id);
  }

  @Post('direct')
  async createDirectMessageRoom(
    @CurrentOrganizationId() organizationId: string,
    @Request() req: any,
    @Body() body: { userId: string }
  ) {
    return await this.chatService.createDirectMessageRoom(req.user.id, body.userId, organizationId);
  }

  @Post('messages/:messageId/read')
  async markAsRead(
    @Param('messageId') messageId: string,
    @Request() req: any
  ) {
    return await this.chatService.markMessageAsRead(messageId, req.user.id);
  }

  @Get('search')
  async searchMessages(
    @Query('roomId') roomId: string,
    @Query('q') query: string,
    @Request() req: any
  ) {
    if (!roomId || !query) {
      throw new Error('roomId and query are required');
    }
    
    return await this.chatService.searchMessages(roomId, query, req.user.id);
  }
}