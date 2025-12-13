import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string; // for template-based emails
  context?: Record<string, unknown>; // for template context
  html?: string; // for HTML content
  text?: string; // for plain text
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
        html: options.html,
        text: options.text,
      });

      this.logger.log(
        `Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to JasaWeb Client Portal',
      template: './welcome', // Use template
      context: {
        name: name || 'there', // Use provided name or default
      },
    });
  }

  /**
   * Send notification email for new approval requests
   */
  async sendApprovalRequestNotification(
    email: string,
    projectName: string,
    approvalDetails: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Approval Request for ${projectName}`,
      template: './approval-request',
      context: {
        projectName,
        approvalDetails,
      },
    });
  }

  /**
   * Send notification email when approval is completed
   */
  async sendApprovalCompletedNotification(
    email: string,
    projectName: string,
    status: 'approved' | 'rejected',
    feedback?: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Approval ${status.toUpperCase()} for ${projectName}`,
      template: './approval-completed',
      context: {
        projectName,
        status,
        feedback: feedback || 'No additional feedback provided',
      },
    });
  }

  /**
   * Send notification email for new tickets
   */
  async sendTicketCreatedNotification(
    email: string,
    ticketTitle: string,
    projectName: string,
    ticketDescription: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `New Ticket Created: ${ticketTitle}`,
      template: './ticket-created',
      context: {
        ticketTitle,
        projectName,
        ticketDescription,
      },
    });
  }

  /**
   * Send notification email when ticket status changes
   */
  async sendTicketStatusChangedNotification(
    email: string,
    ticketId: string,
    ticketTitle: string,
    newStatus: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Ticket #${ticketId} Status Updated: ${newStatus}`,
      template: './ticket-status-changed',
      context: {
        ticketId,
        ticketTitle,
        newStatus,
      },
    });
  }

  /**
   * Send invoice notification
   */
  async sendInvoiceNotification(
    email: string,
    invoiceNumber: string,
    amount: number,
    dueDate: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `New Invoice: ${invoiceNumber}`,
      template: './invoice',
      context: {
        invoiceNumber,
        amount,
        dueDate,
      },
    });
  }
}
