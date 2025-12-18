import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  metric?: string;

  @IsOptional()
  @IsString()
  period?: string; // 'day', 'week', 'month', 'year'

  @IsOptional()
  @IsString()
  groupBy?: string;
}
