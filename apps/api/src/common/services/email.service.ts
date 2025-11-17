import { Injectable, Logger } from '@nestjs/common';
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
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize the transporter with environment configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587', 10),
      secure: process.env.EMAIL_SERVER_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      // Prepare email content
      let htmlContent = options.html;
      let textContent = options.text;

      // If template is provided, render it with context
      if (options.template && options.context) {
        const templatePath = path.join(
          process.cwd(),
          'templates',
          `${options.template}.hbs`
        );
        if (fs.existsSync(templatePath)) {
          const templateSource = fs.readFileSync(templatePath, 'utf8');
          const template = handlebars.compile(templateSource);
          htmlContent = template(options.context);
        }
      }

      // Send email using nodemailer
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"JasaWeb" <noreply@jasaweb.com>',
        to: options.to,
        subject: options.subject,
        html: htmlContent,
        text: textContent,
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`
      );
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error; // Re-throw the error to be handled by calling functions
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
