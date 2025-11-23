import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';
import { EmailModule } from '../common/services/email.module';

@Module({
  imports: [MultiTenantPrismaModule, EmailModule],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}