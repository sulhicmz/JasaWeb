import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

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
  private readonly transporter: nodemailer.Transporter;
  private readonly templatesDir: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_SERVER_HOST', 'localhost'),
      port: this.configService.get<number>('EMAIL_SERVER_PORT', 587),
      secure:
        this.configService.get<string>('EMAIL_SERVER_SECURE', 'false') ===
        'true',
      auth: {
        user: this.configService.get<string>('EMAIL_SERVER_USER'),
        pass: this.configService.get<string>('EMAIL_SERVER_PASSWORD'),
      },
    });

    this.templatesDir = path.join(process.cwd(), 'templates');

    // Register handlebars helpers
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers(): void {
    // Add any custom handlebars helpers here
    handlebars.registerHelper('eq', function (a: any, b: any) {
      return a === b;
    });

    handlebars.registerHelper('formatDate', function (date: Date) {
      return new Date(date).toLocaleDateString();
    });
  }

  private renderTemplate(
    templateName: string,
    context: Record<string, unknown>
  ): string {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      return template(context);
    } catch (error: any) {
      this.logger.error(
        `Failed to render template ${templateName}: ${error.message}`
      );
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html: string | undefined;
      let text: string | undefined;

      if (options.template) {
        html = this.renderTemplate(options.template, options.context || {});
        // Generate plain text from HTML (basic version)
        text = html
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        html = options.html;
        text = options.text;
      }

      const mailOptions = {
        from: this.configService.get<string>(
          'EMAIL_FROM',
          '"JasaWeb" <noreply@jasaweb.com>'
        ),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`
      );
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to JasaWeb Client Portal',
      template: 'welcome',
      context: {
        name: name || 'there',
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
      template: 'approval-request',
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
      template: 'approval-completed',
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
      template: 'ticket-created',
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
      template: 'ticket-status-changed',
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
      template: 'invoice',
      context: {
        invoiceNumber,
        amount,
        dueDate,
      },
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email transporter configuration verified successfully');
      return true;
    } catch (error: any) {
      this.logger.error(
        `Email transporter verification failed: ${error.message}`
      );
      return false;
    }
  }
}
