import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  IDR = 'IDR',
  GBP = 'GBP',
  JPY = 'JPY',
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(Currency)
  currency!: Currency;

  @IsDateString()
  issuedAt!: Date;

  @IsDateString()
  dueAt!: Date;

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
