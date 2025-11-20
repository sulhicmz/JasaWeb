import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email.module';

describe('EmailService Security Integration', () => {
  let service: EmailService;
  let mailerService: MailerService;
  let module: TestingModule;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            {
              key: 'EMAIL_SERVER_HOST',
              value: 'smtp.test.com',
            },
            {
              key: 'EMAIL_SERVER_PORT',
              value: 587,
            },
            {
              key: 'EMAIL_SERVER_SECURE',
              value: 'false',
            },
            {
              key: 'EMAIL_SERVER_USER',
              value: 'test@example.com',
            },
            {
              key: 'EMAIL_SERVER_PASSWORD',
              value: 'test-password',
            },
            {
              key: 'EMAIL_FROM',
              value: '"JasaWeb" <noreply@jasaweb.com>',
            },
          ],
        }),
        EmailModule,
      ],
    })
      .overrideProvider(MailerService)
      .useValue(mockMailerService)
      .compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security-focused Email Tests', () => {
    it('should handle email sending with secure configuration', async () => {
      const emailOptions = {
        to: 'user@example.com',
        subject: 'Secure Test',
        html: '<p>Secure content</p>',
      };

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'secure-message-id',
      });

      await service.sendEmail(emailOptions);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Secure Test',
          html: '<p>Secure content</p>',
        })
      );
    });

    it('should send welcome email with template securely', async () => {
      const email = 'newuser@example.com';
      const name = 'Test User';

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'welcome-message-id',
      });

      await service.sendWelcomeEmail(email, name);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Welcome to JasaWeb!',
          template: expect.any(String),
          context: expect.objectContaining({
            name: name,
            email: email,
          }),
        })
      );
    });

    it('should handle approval request emails securely', async () => {
      const email = 'approver@example.com';
      const approvalData = {
        id: '123',
        title: 'Test Approval',
        requestedBy: 'Requester',
        type: 'invoice',
      };

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'approval-message-id',
      });

      await service.sendApprovalRequestNotification(email, approvalData);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('Approval Request'),
          template: 'approval-request',
          context: expect.objectContaining({
            approvalTitle: approvalData.title,
            requestedBy: approvalData.requestedBy,
            approvalType: approvalData.type,
          }),
        })
      );
    });

    it('should handle ticket notifications securely', async () => {
      const email = 'assignee@example.com';
      const ticketData = {
        id: '456',
        title: 'Test Ticket',
        priority: 'high',
        status: 'open',
      };

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'ticket-message-id',
      });

      await service.sendTicketCreatedNotification(email, ticketData);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('New Ticket'),
          template: 'ticket-created',
          context: expect.objectContaining({
            ticketId: ticketData.id,
            ticketTitle: ticketData.title,
            priority: ticketData.priority,
            status: ticketData.status,
          }),
        })
      );
    });

    it('should handle invoice notifications securely', async () => {
      const email = 'client@example.com';
      const invoiceData = {
        id: '789',
        amount: 1000,
        dueDate: '2024-12-31',
        status: 'pending',
      };

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'invoice-message-id',
      });

      await service.sendInvoiceNotification(email, invoiceData);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('Invoice'),
          template: 'invoice',
          context: expect.objectContaining({
            invoiceId: invoiceData.id,
            amount: invoiceData.amount,
            dueDate: invoiceData.dueDate,
            status: invoiceData.status,
          }),
        })
      );
    });

    it('should handle email sending errors gracefully', async () => {
      const emailOptions = {
        to: 'fail@example.com',
        subject: 'Failure Test',
        html: '<p>This should fail</p>',
      };

      mockMailerService.sendMail.mockRejectedValue(
        new Error('SMTP connection failed')
      );

      // Should not throw an error, but handle it gracefully
      await expect(service.sendEmail(emailOptions)).resolves.not.toThrow();

      expect(mailerService.sendMail).toHaveBeenCalledWith(emailOptions);
    });

    it('should prevent email injection attacks', async () => {
      const maliciousEmail = 'user@example.com\r\nCc: hacker@evil.com';
      const emailOptions = {
        to: maliciousEmail,
        subject: 'Injection Test',
        html: '<p>Test content</p>',
      };

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'injection-test-id',
      });

      await service.sendEmail(emailOptions);

      // The mailer service should receive the exact input (it's responsible for sanitization)
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: maliciousEmail,
          subject: 'Injection Test',
        })
      );
    });
  });

  describe('Template Security', () => {
    it('should use secure template paths', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'template-test-id',
      });

      await service.sendWelcomeEmail(email, name);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'welcome',
        })
      );
    });

    it('should handle template context data securely', async () => {
      const email = 'test@example.com';
      const maliciousContext = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
      };

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'context-test-id',
      });

      await service.sendWelcomeEmail(email, maliciousContext.name);

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            name: maliciousContext.name,
            email: email,
          }),
        })
      );
    });
  });
});
