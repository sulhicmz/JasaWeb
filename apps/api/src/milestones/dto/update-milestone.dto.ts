import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { MilestoneStatus } from './create-milestone.dto';

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: Date;

  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
