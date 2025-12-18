import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { InvoiceStatus, Currency } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsDateString()
  issuedAt?: Date;

  @IsOptional()
  @IsDateString()
  dueAt?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
