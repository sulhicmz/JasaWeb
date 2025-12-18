import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from './invoice.controller';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { EmailService } from '../common/services/email.service';
import {
  CreateInvoiceDto,
  Currency,
  InvoiceStatus,
} from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { vi } from 'vitest';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let multiTenantPrisma: MultiTenantPrismaService;
  let emailService: EmailService;

  const mockPrisma = {
    invoice: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
  };

  const mockEmailService = {
    sendInvoiceEmail: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: MultiTenantPrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    multiTenantPrisma = module.get<MultiTenantPrismaService>(
      MultiTenantPrismaService
    );
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an invoice', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        amount: 1000,
        currency: Currency.USD,
        issuedAt: new Date('2024-01-01'),
        dueAt: new Date('2024-01-31'),
        description: 'Test invoice',
      };

      const result = {
        id: '1',
        amount: 1000,
        currency: Currency.USD,
        issuedAt: new Date('2024-01-01'),
        dueAt: new Date('2024-01-31'),
        description: 'Test invoice',
        status: 'DRAFT',
      };

      mockPrisma.invoice.create.mockResolvedValue(result);

      const response = await controller.create(createInvoiceDto, 'org-1');

      expect(response).toEqual(result);
      expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amount: 1000,
          currency: Currency.USD,
          issuedAt: new Date('2024-01-01'),
          dueAt: new Date('2024-01-31'),
          description: 'Test invoice',
          organization: { connect: { id: 'org-1' } },
        }),
      });
    });

    it('should validate project belongs to organization when provided', async () => {
      const createInvoiceDto: CreateInvoiceDto = {
        projectId: 'project-1',
        amount: 1000,
        currency: Currency.USD,
        issuedAt: new Date('2024-01-01'),
        dueAt: new Date('2024-01-31'),
      };

      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'project-1',
        organizationId: 'other-org',
      });

      await expect(
        controller.create(createInvoiceDto, 'org-1')
      ).rejects.toThrow(
        'Project does not exist or does not belong to your organization'
      );
    });
  });

  describe('findAll', () => {
    it('should return all invoices for organization', async () => {
      const invoices = [
        { id: '1', amount: 1000, currency: 'USD' },
        { id: '2', amount: 2000, currency: 'USD' },
      ];

      mockPrisma.invoice.findMany.mockResolvedValue(invoices);

      const result = await controller.findAll('org-1');

      expect(result).toEqual(invoices);
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
      });
    });
  });

  describe('update', () => {
    it('should update an invoice and set paidAt when status is PAID', async () => {
      const updateInvoiceDto: UpdateInvoiceDto = {
        status: InvoiceStatus.PAID,
      };

      const existingInvoice = { id: '1', status: 'SENT' };
      const updatedInvoice = {
        id: '1',
        status: 'PAID',
        paidAt: new Date(),
      };

      mockPrisma.invoice.findUnique.mockResolvedValue(existingInvoice);
      mockPrisma.invoice.update.mockResolvedValue(updatedInvoice);

      const result = await controller.update('1', updateInvoiceDto, 'org-1');

      expect(result).toEqual(updatedInvoice);
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...updateInvoiceDto,
          paidAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should remove an invoice', async () => {
      const result = { id: '1' };
      mockPrisma.invoice.delete.mockResolvedValue(result);

      const response = await controller.remove('1', 'org-1');

      expect(response).toEqual(result);
      expect(mockPrisma.invoice.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
