import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectAnalyticsDto {
  @IsString()
  organizationId!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsEnum(['7d', '30d', '90d', '1y'])
  timeRange?: string = '30d';
}

export class ProjectMetricsDto {
  @IsNumber()
  totalProjects!: number;

  @IsNumber()
  activeProjects!: number;

  @IsNumber()
  completedProjects!: number;

  @IsNumber()
  overdueProjects!: number;

  @IsNumber()
  averageCompletionTime!: number;

  @IsNumber()
  onTimeDeliveryRate!: number;

  @IsNumber()
  clientSatisfactionScore!: number;

  @IsNumber()
  budgetUtilization!: number;
}

export class TeamWorkloadDto {
  @IsString()
  userId!: string;

  @IsString()
  userName!: string;

  @IsNumber()
  activeTasks!: number;

  @IsNumber()
  workloadPercentage!: number;

  @IsNumber()
  efficiency!: number;
}

export class MilestoneProgressDto {
  @IsNumber()
  onTime!: number;

  @IsNumber()
  delayed!: number;

  @IsNumber()
  upcoming!: number;

  @IsNumber()
  completed!: number;
}

export class ProjectPerformanceInsightsDto {
  @IsEnum(['increasing', 'decreasing', 'stable'])
  productivityTrend!: 'increasing' | 'decreasing' | 'stable';

  @IsArray()
  @IsString({ each: true })
  riskFactors!: string[];

  @IsArray()
  @IsString({ each: true })
  recommendations!: string[];

  @IsArray()
  teamWorkload!: TeamWorkloadDto[];

  milestoneProgress!: MilestoneProgressDto;
}

export class MilestoneDto {
  @IsString()
  id!: string;

  @IsString()
  title!: string;

  @IsDate()
  @Type(() => Date)
  dueDate!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedDate?: Date;

  @IsString()
  status!: string;

  @IsArray()
  @IsString({ each: true })
  dependencies!: string[];
}

export class ProjectTimelineDataDto {
  @IsString()
  projectId!: string;

  @IsString()
  projectName!: string;

  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  endDate!: Date;

  @IsArray()
  milestones!: MilestoneDto[];

  @IsArray()
  @IsString({ each: true })
  criticalPath!: string[];

  @IsNumber()
  bufferTime!: number;
}

export class HealthFactorDto {
  @IsString()
  category!: string;

  @IsNumber()
  impact!: number;

  @IsString()
  description!: string;
}

export class ProjectHealthScoreDto {
  @IsString()
  projectId!: string;

  @IsNumber()
  overallScore!: number;

  @IsNumber()
  scheduleHealth!: number;

  @IsNumber()
  budgetHealth!: number;

  @IsNumber()
  qualityHealth!: number;

  @IsNumber()
  teamHealth!: number;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  riskLevel!: 'low' | 'medium' | 'high' | 'critical';

  @IsArray()
  factors!: HealthFactorDto[];
}

export class RealTimeUpdateDto {
  @IsArray()
  milestones!: any[];

  @IsArray()
  tickets!: any[];

  @IsArray()
  files!: any[];

  @IsDate()
  @Type(() => Date)
  timestamp!: Date;
}
