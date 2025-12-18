import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
} from 'class-validator';

export enum MilestoneStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export class CreateMilestoneDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsDateString()
  dueAt?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;
}
