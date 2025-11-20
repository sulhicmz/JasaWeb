import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollaborationService } from './collaboration.service';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get('online-users')
  @ApiOperation({ summary: 'Get online users in organization' })
  async getOnlineUsers(@Request() req) {
    const onlineUsers = await this.collaborationService.getOnlineUsers(
      req.user.organizationId
    );
    return {
      success: true,
      data: onlineUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastSeen: user.lastSeen,
      })),
    };
  }

  @Get('projects/:projectId/participants')
  @ApiOperation({ summary: 'Get active participants in a project' })
  async getProjectParticipants(@Param('projectId') projectId: string) {
    const participants =
      await this.collaborationService.getProjectParticipants(projectId);
    return {
      success: true,
      data: participants,
    };
  }

  @Get('projects/:projectId/state')
  @ApiOperation({ summary: 'Get complete project state' })
  async getProjectState(@Param('projectId') projectId: string) {
    const state = await this.collaborationService.getProjectState(projectId);
    return {
      success: true,
      data: state,
    };
  }

  @Get('projects/:projectId/messages')
  @ApiOperation({ summary: 'Get project messages' })
  async getProjectMessages(
    @Param('projectId') projectId: string,
    @Body() body: { limit?: number }
  ) {
    const messages = await this.collaborationService.getProjectMessages(
      projectId,
      body.limit || 50
    );
    return {
      success: true,
      data: messages,
    };
  }

  @Post('projects/:projectId/messages')
  @ApiOperation({ summary: 'Create a new message' })
  async createMessage(
    @Param('projectId') projectId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req
  ) {
    const message = await this.collaborationService.createMessage({
      senderId: req.user.id,
      projectId,
      content: createMessageDto.content,
      type: createMessageDto.type,
      recipientId: createMessageDto.recipientId,
    });
    return {
      success: true,
      data: message,
    };
  }
}
