import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { config } from '../../config';

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
      subject: config.email.templates.welcome.subject,
      template: config.email.templates.welcome.template,
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
      subject: config.email.templates.approvalRequest.subject(projectName),
      template: config.email.templates.approvalRequest.template,
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
      subject: config.email.templates.approvalCompleted.subject(
        projectName,
        status
      ),
      template: config.email.templates.approvalCompleted.template,
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
      subject: config.email.templates.ticketCreated.subject(ticketTitle),
      template: config.email.templates.ticketCreated.template,
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
      subject: config.email.templates.ticketStatusChanged.subject(
        ticketId,
        newStatus
      ),
      template: config.email.templates.ticketStatusChanged.template,
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
      subject: config.email.templates.invoice.subject(invoiceNumber),
      template: config.email.templates.invoice.template,
      context: {
        invoiceNumber,
        amount,
        dueDate,
      },
    });
  }
}
