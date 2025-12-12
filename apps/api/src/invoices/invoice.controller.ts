import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  BadRequestException,
  Query,
  Logger,
  Put,
} from '@nestjs/common';
import { MultiTenantPrismaService } from '../common/database/multi-tenant-prisma.service';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentOrganizationId } from '../common/decorators/current-organization-id.decorator';
import { EmailService } from '../common/services/email.service';
import { ThrottlerGuard } from '@nestjs/throttler';

// Define DTO for invoice creation/update
interface CreateInvoiceDto {
  projectId?: string;
  amount: number;
  currency: string; // USD, EUR, etc.
  issuedAt: Date;
  dueAt: Date;
  description?: string;
}

interface UpdateInvoiceDto {
  amount?: number;
  currency?: string;
  issuedAt?: Date;
  dueAt?: Date;
  status?: string; // draft, issued, paid, overdue, cancelled
  description?: string;
}

@Controller('invoices')
@UseGuards(RolesGuard) // Use the roles guard
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(
    private readonly multiTenantPrisma: MultiTenantPrismaService,
    private readonly emailService: EmailService,
  ) {}

  @UseGuards(ThrottlerGuard)
  @Post()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can create invoices
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentOrganizationId() organizationId: string,
  ) {
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

  @Get()
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can view invoices
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @CurrentOrganizationId() organizationId: string = '',
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

  @Get(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance, Role.Member) // Multiple roles allowed to read
  async findOne(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
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

  @UseGuards(ThrottlerGuard)
  @Put(':id/pay') // Endpoint to mark invoice as paid
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can update status
  async markAsPaid(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
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
    const updatedInvoiceWithOrg = updatedInvoice as any;
    if (updatedInvoiceWithOrg.organization && updatedInvoiceWithOrg.organization.billingEmail) {
      let dueDate: string;
      if (updatedInvoice.dueAt) {
        dueDate = updatedInvoice.dueAt.toISOString().split('T')[0] || '';
      } else {
        dueDate = new Date().toISOString().split('T')[0] || '';
      }
      // Ensure we have a valid date string
      if (!dueDate) {
        dueDate = new Date().toISOString().split('T')[0] || 'Unknown';
      }
      await this.emailService.sendInvoiceNotification(
        updatedInvoiceWithOrg.organization.billingEmail,
        `INV-${updatedInvoice.id.substring(0, 8).toUpperCase()}`,
        updatedInvoice.amount,
        dueDate
      );
    }

    this.logger.log(`Invoice marked as paid: ${updatedInvoice.id} for organization ${organizationId}`);

    return updatedInvoice;
  }

  @UseGuards(ThrottlerGuard)
  @Patch(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin, Role.Finance) // Only specific roles can update invoices
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @CurrentOrganizationId() organizationId: string,
  ) {
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
      const updatedInvoiceWithOrg = updatedInvoice as any;
      if (updatedInvoiceWithOrg.organization && updatedInvoiceWithOrg.organization.billingEmail) {
        let dueDate: string;
        if (updatedInvoice.dueAt) {
          dueDate = updatedInvoice.dueAt.toISOString().split('T')[0] || '';
        } else {
          dueDate = new Date().toISOString().split('T')[0] || '';
        }
        // Ensure we have a valid date string
        if (!dueDate) {
          dueDate = new Date().toISOString().split('T')[0] || 'Unknown';
        }
        await this.emailService.sendInvoiceNotification(
          updatedInvoiceWithOrg.organization.billingEmail,
          `INV-${updatedInvoice.id.substring(0, 8).toUpperCase()}`,
          updatedInvoice.amount,
          dueDate
        );
      }
    }

    this.logger.log(`Invoice updated: ${updatedInvoice.id} for organization ${organizationId}`);

    return updatedInvoice;
  }

  @UseGuards(ThrottlerGuard)
  @Delete(':id')
  @Roles(Role.OrgOwner, Role.OrgAdmin) // Only org owners can delete
  async remove(
    @Param('id') id: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
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
}