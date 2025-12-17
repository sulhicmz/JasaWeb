import { vi } from 'vitest';
import { EmailService, EmailOptions } from './email.service';

// Create a simple test without NestJS DI
describe('EmailService', () => {
  let service: EmailService;
  let mockMailerService: any;

  beforeEach(() => {
    mockMailerService = {
      sendMail: vi.fn(),
    };

    // Manually create the service with the mocked MailerService
    service = new EmailService(mockMailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      };

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendEmail(emailOptions);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(emailOptions);
    });

    it('should handle email sending errors gracefully', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      };

      const error = new Error('SMTP connection failed');
      mockMailerService.sendMail.mockRejectedValue(error);

      // Should not throw error, but should log it
      await expect(service.sendEmail(emailOptions)).resolves.not.toThrow();
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(emailOptions);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with template', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendWelcomeEmail(email, name);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Welcome to JasaWeb Client Portal',
        template: './welcome',
        context: {
          name,
        },
      });
    });

    it('should send welcome email with default name when none provided', async () => {
      const email = 'test@example.com';

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendWelcomeEmail(email);

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Welcome to JasaWeb Client Portal',
        template: './welcome',
        context: {
          name: 'there',
        },
      });
    });
  });

  describe('sendApprovalRequestNotification', () => {
    it('should send approval request notification', async () => {
      const email = 'test@example.com';
      const projectName = 'Test Project';
      const approvalDetails = 'Design mockup for review';

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendApprovalRequestNotification(
        email,
        projectName,
        approvalDetails
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Approval Request for Test Project',
        template: './approval-request',
        context: {
          projectName,
          approvalDetails,
        },
      });
    });
  });

  describe('sendApprovalCompletedNotification', () => {
    it('should send approval completed notification for approved status', async () => {
      const email = 'test@example.com';
      const projectName = 'Test Project';
      const status = 'approved' as const;
      const feedback = 'Looks good!';

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendApprovalCompletedNotification(
        email,
        projectName,
        status,
        feedback
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Approval APPROVED for Test Project',
        template: './approval-completed',
        context: {
          projectName,
          status,
          feedback,
        },
      });
    });

    it('should send approval completed notification with default feedback', async () => {
      const email = 'test@example.com';
      const projectName = 'Test Project';
      const status = 'rejected' as const;

      mockMailerService.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendApprovalCompletedNotification(
        email,
        projectName,
        status
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: 'Approval REJECTED for Test Project',
        template: './approval-completed',
        context: {
          projectName,
          status,
          feedback: 'No additional feedback provided',
        },
      });
    });
  });
});
