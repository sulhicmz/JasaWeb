import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import {
  UpdatableDto,
  Currency,
  InvoiceStatus,
} from '../../common/dto/base.dto';

export class UpdateInvoiceDto extends UpdatableDto {
  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amount?: number;

  @IsString()
  @IsOptional()
  @IsEnum(Currency, {
    message: 'Currency must be one of: USD, EUR, GBP, JPY, IDR',
  })
  currency?: Currency;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsString()
  @IsOptional()
  @IsEnum(InvoiceStatus, {
    message: 'Status must be one of: draft, sent, paid, overdue, cancelled',
  })
  status?: InvoiceStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
