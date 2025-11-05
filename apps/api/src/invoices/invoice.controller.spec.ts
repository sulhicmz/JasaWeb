import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from './invoice.controller';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { EmailService } from '../common/services/email.service';
import { Role } from '../common/decorators/roles.decorator';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let prismaService: jest.Mocked<MultiTenantPrismaService>;
  let emailService: jest.Mocked<EmailService>;

  const mockPrismaService = {
    invoice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  const mockEmailService = {
    sendInvoiceNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    prismaService = module.get(MultiTenantPrismaService);
    emailService = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an invoice successfully', async () => {
      const createInvoiceDto = {
        amount: 1000,
        currency: 'USD',
        issuedAt: new Date('2024-01-01'),
        dueAt: new Date('2024-01-31'),
        description: 'Test Invoice',
      };

      const organizationId = 'org-123';
      const expectedResult = {
        id: 'inv-123',
        ...createInvoiceDto,
        organizationId,
        status: 'draft',
        organization: { id: 'org-123', name: 'Test Org', billingEmail: 'billing@test.com' },
        project: null,
        issuedBy: { id: 'user-123', name: 'Test User', email: 'user@test.com' },
      };

      mockPrismaService.invoice.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createInvoiceDto, organizationId);

      expect(prismaService.invoice.create).toHaveBeenCalledWith({
        data: {
          ...createInvoiceDto,
          organizationId,
          status: 'draft',
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              billingEmail: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should create an invoice with project successfully', async () => {
      const createInvoiceDto = {
        projectId: 'proj-123',
        amount: 1000,
        currency: 'USD',
        issuedAt: new Date('2024-01-01'),
        dueAt: new Date('2024-01-31'),
      };

      const organizationId = 'org-123';
      const mockProject = { id: 'proj-123', name: 'Test Project' };
      const expectedResult = {
        id: 'inv-123',
        ...createInvoiceDto,
        organizationId,
        status: 'draft',
        organization: { id: 'org-123', name: 'Test Org', billingEmail: 'billing@test.com' },
        project: mockProject,
        issuedBy: { id: 'user-123', name: 'Test User', email: 'user@test.com' },
      };

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.invoice.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createInvoiceDto, organizationId);

      expect(prismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'proj-123' },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when project does not exist', async () => {
      const createInvoiceDto = {
        projectId: 'invalid-proj',
        amount: 1000,
        currency: 'USD',
        issuedAt: new Date('2024-01-01'),
        dueAt: new Date('2024-01-31'),
      };

      const organizationId = 'org-123';

      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(controller.create(createInvoiceDto, organizationId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findAll', () => {
    it('should return all invoices for organization', async () => {
      const organizationId = 'org-123';
      const expectedResult = [
        {
          id: 'inv-1',
          amount: 1000,
          status: 'draft',
          organization: { id: 'org-123', name: 'Test Org', billingEmail: 'billing@test.com' },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(expectedResult);

      const result = await controller.findAll(undefined, undefined, organizationId);

      expect(prismaService.invoice.findMany).toHaveBeenCalledWith({
        where: { organizationId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              billingEmail: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should filter invoices by project and status', async () => {
      const organizationId = 'org-123';
      const projectId = 'proj-123';
      const status = 'paid';
      const expectedResult = [];

      mockPrismaService.invoice.findMany.mockResolvedValue(expectedResult);

      const result = await controller.findAll(projectId, status, organizationId);

      expect(prismaService.invoice.findMany).toHaveBeenCalledWith({
        where: { organizationId, projectId, status },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single invoice', async () => {
      const invoiceId = 'inv-123';
      const organizationId = 'org-123';
      const expectedResult = {
        id: 'inv-123',
        amount: 1000,
        organizationId: 'org-123',
        organization: { id: 'org-123', name: 'Test Org', billingEmail: 'billing@test.com' },
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(expectedResult);

      const result = await controller.findOne(invoiceId, organizationId);

      expect(prismaService.invoice.findUnique).toHaveBeenCalledWith({
        where: { id: invoiceId },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              billingEmail: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when invoice not found', async () => {
      const invoiceId = 'invalid-inv';
      const organizationId = 'org-123';

      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(controller.findOne(invoiceId, organizationId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when invoice belongs to different organization', async () => {
      const invoiceId = 'inv-123';
      const organizationId = 'org-123';
      const mockInvoice = {
        id: 'inv-123',
        organizationId: 'different-org',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);

      await expect(controller.findOne(invoiceId, organizationId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark invoice as paid successfully', async () => {
      const invoiceId = 'inv-123';
      const organizationId = 'org-123';
      const mockInvoice = {
        id: 'inv-123',
        organizationId: 'org-123',
        amount: 1000,
      };
      const expectedResult = {
        ...mockInvoice,
        status: 'paid',
        updatedAt: new Date(),
        organization: { id: 'org-123', name: 'Test Org', billingEmail: 'billing@test.com' },
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.invoice.update.mockResolvedValue(expectedResult);
      mockEmailService.sendInvoiceNotification.mockResolvedValue(undefined);

      const result = await controller.markAsPaid(invoiceId, organizationId);

      expect(prismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(emailService.sendInvoiceNotification).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when invoice not found for payment', async () => {
      const invoiceId = 'invalid-inv';
      const organizationId = 'org-123';

      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(controller.markAsPaid(invoiceId, organizationId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('update', () => {
    it('should update an invoice successfully', async () => {
      const invoiceId = 'inv-123';
      const organizationId = 'org-123';
      const updateInvoiceDto = {
        amount: 1500,
        status: 'issued',
      };
      const mockExistingInvoice = {
        id: 'inv-123',
        status: 'draft',
      };
      const expectedResult = {
        ...mockExistingInvoice,
        ...updateInvoiceDto,
        updatedAt: new Date(),
        organization: { id: 'org-123', name: 'Test Org', billingEmail: 'billing@test.com' },
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockExistingInvoice);
      mockPrismaService.invoice.update.mockResolvedValue(expectedResult);
      mockEmailService.sendInvoiceNotification.mockResolvedValue(undefined);

      const result = await controller.update(invoiceId, updateInvoiceDto, organizationId);

      expect(prismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: {
          ...updateInvoiceDto,
        },
        include: expect.any(Object),
      });
      expect(emailService.sendInvoiceNotification).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should set paidAt when status is paid', async () => {
      const invoiceId = 'inv-123';
      const organizationId = 'org-123';
      const updateInvoiceDto = {
        status: 'paid',
      };
      const mockExistingInvoice = {
        id: 'inv-123',
        status: 'issued',
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockExistingInvoice);
      mockPrismaService.invoice.update.mockResolvedValue({});

      await controller.update(invoiceId, updateInvoiceDto, organizationId);

      expect(prismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: {
          ...updateInvoiceDto,
          paidAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should delete an invoice successfully', async () => {
      const invoiceId = 'inv-123';
      const organizationId = 'org-123';
      const mockInvoice = {
        id: 'inv-123',
        organizationId: 'org-123',
      };
      const deletedInvoice = {
        ...mockInvoice,
        deletedAt: new Date(),
      };

      mockPrismaService.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaService.invoice.delete.mockResolvedValue(deletedInvoice);

      const result = await controller.remove(invoiceId, organizationId);

      expect(prismaService.invoice.delete).toHaveBeenCalledWith({
        where: { id: invoiceId },
      });
      expect(result).toEqual({ message: 'Invoice deleted successfully' });
    });

    it('should throw error when invoice not found for deletion', async () => {
      const invoiceId = 'invalid-inv';
      const organizationId = 'org-123';

      mockPrismaService.invoice.findUnique.mockResolvedValue(null);

      await expect(controller.remove(invoiceId, organizationId)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});