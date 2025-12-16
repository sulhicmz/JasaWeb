import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  UpdatableDto,
  TicketType,
  TicketPriority,
  TicketStatus,
} from '../../common/dto/base.dto';

export class UpdateTicketDto extends UpdatableDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(TicketType, {
    message: 'Type must be one of: bug, feature, improvement, question, task',
  })
  type?: TicketType;

  @IsString()
  @IsOptional()
  @IsEnum(TicketPriority, {
    message: 'Priority must be one of: critical, high, medium, low',
  })
  priority?: TicketPriority;

  @IsString()
  @IsOptional()
  @IsEnum(TicketStatus, {
    message: 'Status must be one of: open, in_progress, resolved, closed',
  })
  status?: TicketStatus;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
