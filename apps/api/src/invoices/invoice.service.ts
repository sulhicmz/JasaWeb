import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { EmailService } from '../common/services/email.service';

export interface CreateInvoiceDto {
  projectId?: string;
  amount: number;
  currency: string; // USD, EUR, etc.
  issuedAt: Date;
  dueAt: Date;
  description?: string;
}

export interface UpdateInvoiceDto {
  amount?: number;
  currency?: string;
  issuedAt?: Date;
  dueAt?: Date;
  status?: string; // draft, issued, paid, overdue, cancelled
  description?: string;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, organizationId: string) {
    // If a project is specified, validate that it belongs to the organization
    if (createInvoiceDto.projectId) {
      const project = await this.multiTenantPrisma.project.findUnique({
        where: { id: createInvoiceDto.projectId },
      });

      if (!project) {
        throw new BadRequestException('Project does not exist or does not belong to your organization');
      }
    }

    // Create the invoice
const invoice = await this.multiTenantPrisma.invoice.create({
      data: {
        ...createInvoiceDto,
        organizationId,
        status: 'draft', // Default status
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            billingEmail: true,
          },
        },
      },
    });

    this.logger.log(`Invoice created: ${invoice.id} for organization ${organizationId}`);

    return invoice;
  }

  async findAll(
    projectId?: string,
    status?: string,
    organizationId: string = '',
  ) {
    // Build query based on filters
    const whereClause: any = { organizationId }; // Ensure multi-tenant isolation

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (status) {
      whereClause.status = status;
    }

    return await this.multiTenantPrisma.invoice.findMany({
      where: whereClause,
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
  }

  async findOne(id: string, organizationId: string) {
    const invoice = await this.multiTenantPrisma.invoice.findUnique({
      where: { id },
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
      }
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found or does not belong to your organization');
    }

    // Verify that the invoice belongs to the current organization
    if (invoice.organizationId !== organizationId) {
      throw new BadRequestException('Invoice does not belong to your organization');
    }

    return invoice;
  }

  async markAsPaid(id: string, organizationId: string) {
    const invoice = await this.multiTenantPrisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found or does not belong to your organization');
    }

    const updatedInvoice = await this.multiTenantPrisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        updatedAt: new Date(),
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

    // Send notification email about payment
    if (updatedInvoice.organization.billingEmail) {
      await this.emailService.sendInvoiceNotification(
        updatedInvoice.organization.billingEmail,
        updatedInvoice.id,
        updatedInvoice.amount,
        updatedInvoice.dueAt.toISOString().split('T')[0],
      );
    }

    this.logger.log(`Invoice marked as paid: ${updatedInvoice.id} for organization ${organizationId}`);

    return updatedInvoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, organizationId: string) {
    // Check if invoice exists and belongs to the organization
    const existingInvoice = await this.multiTenantPrisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      throw new BadRequestException('Invoice not found or does not belong to your organization');
    }

    // Update the invoice
    const updatedInvoice = await this.multiTenantPrisma.invoice.update({
      where: { id },
      data: {
        ...updateInvoiceDto,
        ...(updateInvoiceDto.status === 'paid' && { paidAt: new Date() }), // Set paidAt when status is paid
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

    // Send notification if status changed to issued
    if (updateInvoiceDto.status === 'issued' && existingInvoice.status !== 'issued') {
if (updatedInvoice.organization?.billingEmail) {
        await this.emailService.sendInvoiceNotification(
updatedInvoice.organization?.billingEmail,
          updatedInvoice.id,
          updatedInvoice.amount,
          updatedInvoice.dueAt.toISOString().split('T')[0],
        );
      }
    }

    this.logger.log(`Invoice updated: ${updatedInvoice.id} for organization ${organizationId}`);

    return updatedInvoice;
  }

  async remove(id: string, organizationId: string) {
    const invoice = await this.multiTenantPrisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found or does not belong to your organization');
    }

    const deletedInvoice = await this.multiTenantPrisma.invoice.delete({
      where: { id },
    });

    this.logger.log(`Invoice deleted: ${deletedInvoice.id} for organization ${organizationId}`);

    return { message: 'Invoice deleted successfully' };
  }

  // Business logic methods
  async findByStatus(status: string, organizationId: string) {
    return this.findAll(undefined, status, organizationId);
  }

  async findByProject(projectId: string, organizationId: string) {
    return this.findAll(projectId, undefined, organizationId);
  }

  async getInvoiceStats(organizationId: string) {
    const invoices = (await this.multiTenantPrisma.invoice.findMany({
      where: { organizationId },
    })) as Array<{ status: string; amount: number }>;

    const total = invoices.length;
    const draft = invoices.filter(inv => inv.status === 'draft').length;
    const issued = invoices.filter(inv => inv.status === 'issued').length;
    const paid = invoices.filter(inv => inv.status === 'paid').length;
    const overdue = invoices.filter(inv => inv.status === 'overdue').length;

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      total,
      draft,
      issued,
      paid,
      overdue,
      totalAmount,
      paidAmount,
      outstandingAmount: totalAmount - paidAmount,
      paymentRate: total > 0 ? Math.round((paid / total) * 100) : 0,
    };
  }
}