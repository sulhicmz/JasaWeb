import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';

export enum TicketType {
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
  QUESTION = 'question',
  TASK = 'task',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  IN_REVIEW = 'in-review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TicketType)
  type!: TicketType;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}
