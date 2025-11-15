import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NotificationService, NotificationType } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: NotificationType
  ) {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    return this.notificationService.getUserNotifications(
      userId,
      organizationId,
      {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        unreadOnly: unreadOnly === 'true',
        type: type as NotificationType,
      }
    );
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;
    await this.notificationService.markAsRead(id, userId);
    return { success: true };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;
    await this.notificationService.markAllAsRead(userId, organizationId);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;
    const count = await this.notificationService.getUnreadCount(
      userId,
      organizationId
    );
    return { count };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;
    await this.notificationService.deleteNotification(id, userId);
    return { success: true };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Request() req: any) {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;
    const preferences = await this.notificationService.getUserPreferences(
      userId,
      organizationId
    );
    return { preferences };
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Body()
    body: {
      preferences: Array<{
        type: string;
        inAppEnabled: boolean;
        emailEnabled: boolean;
        browserEnabled: boolean;
      }>;
    },
    @Request() req: any
  ) {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;
    await this.notificationService.updateUserPreferences(
      userId,
      organizationId,
      body.preferences
    );
    return { success: true };
  }
}
