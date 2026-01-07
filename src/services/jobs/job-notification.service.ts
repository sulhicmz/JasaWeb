import { logger } from '@/lib/logger';

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  channel?: 'email' | 'sms' | 'push';
  metadata?: Record<string, unknown>;
}

export class NotificationJobHandler {
  async handle(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { userId, type, title, message, channel, metadata } = payload as unknown as NotificationPayload;

    logger.info(`Processing notification job`, {
      userId,
      type,
      channel,
    } as Record<string, unknown>);

    try {
      const result = await this.sendNotification({
        userId,
        type,
        title,
        message,
        channel: channel || 'email',
        metadata,
      });

      return {
        success: true,
        sent: true,
        channel: result.channel || 'email',
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to send notification`, {
        userId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  private async sendNotification(params: NotificationPayload): Promise<{
    channel: string;
    messageId?: string;
  }> {
    logger.debug(`Sending notification via ${params.channel}`, params as unknown as Record<string, unknown>);

    await this.simulateDelay(100);

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    logger.info(`Notification sent successfully`, {
      userId: params.userId,
      messageId,
      channel: params.channel || 'email',
    } as Record<string, unknown>);

    return {
      channel: params.channel || 'email',
      messageId,
    };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
