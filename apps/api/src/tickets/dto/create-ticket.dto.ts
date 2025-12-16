import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  CreatableDto,
  TicketType,
  TicketPriority,
} from '../../common/dto/base.dto';

export class CreateTicketDto extends CreatableDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsString()
  @IsEnum(TicketType, {
    message: 'Type must be one of: bug, feature, improvement, question, task',
  })
  type!: TicketType;

  @IsString()
  @IsEnum(TicketPriority, {
    message: 'Priority must be one of: critical, high, medium, low',
  })
  priority!: TicketPriority;

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
