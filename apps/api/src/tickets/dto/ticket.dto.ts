import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { TicketType, TicketPriority } from '../../common/enums';

export class CreateTicketDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(TicketType)
  type!: TicketType;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @IsString()
  @IsOptional()
  projectId?: string;
}

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TicketType)
  @IsOptional()
  type?: TicketType;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}

import { TicketStatus } from '../../common/enums';
