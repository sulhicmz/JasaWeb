import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { CreatableDto, Currency } from '../../common/dto/base.dto';

export class CreateInvoiceDto extends CreatableDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsEnum(Currency, {
    message: 'Currency must be one of: USD, EUR, GBP, JPY, IDR',
  })
  currency!: Currency;

  @IsDateString()
  issuedAt!: string;

  @IsDateString()
  dueAt!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
