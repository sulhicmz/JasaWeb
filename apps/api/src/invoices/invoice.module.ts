import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { EmailService } from '../common/services/email.service';

@Module({
  controllers: [InvoiceController],
  providers: [EmailService],
})
export class InvoiceModule {}