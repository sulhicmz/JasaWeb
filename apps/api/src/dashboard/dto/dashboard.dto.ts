import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DashboardTimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class DashboardStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Time range for dashboard statistics',
    enum: DashboardTimeRange,
    default: DashboardTimeRange.MONTH,
  })
  @IsOptional()
  @IsEnum(DashboardTimeRange)
  timeRange?: DashboardTimeRange = DashboardTimeRange.MONTH;

  @ApiPropertyOptional({
    description: 'Force refresh of cached data',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  refresh?: boolean = false;
}

export class RecentActivityQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of activities to return',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter activities by type',
    enum: ['project', 'ticket', 'milestone', 'invoice'],
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class ProjectsOverviewQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of projects to return',
    default: 6,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 6;

  @ApiPropertyOptional({
    description: 'Filter projects by status',
    enum: ['active', 'completed', 'on-hold', 'planning'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Sort projects by field',
    enum: ['name', 'createdAt', 'updatedAt', 'dueAt', 'progress'],
    default: 'updatedAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Response DTOs
export class ProjectStatsDto {
  @ApiProperty({ description: 'Total number of projects' })
  total: number;

  @ApiProperty({ description: 'Number of active projects' })
  active: number;

  @ApiProperty({ description: 'Number of completed projects' })
  completed: number;

  @ApiProperty({ description: 'Number of on-hold projects' })
  onHold: number;

  @ApiProperty({ description: 'Number of projects in planning phase' })
  planning: number;

  @ApiProperty({ description: 'Average project completion percentage' })
  averageProgress: number;

  @ApiProperty({ description: 'Number of overdue projects' })
  overdue: number;
}

export class TicketStatsDto {
  @ApiProperty({ description: 'Total number of tickets' })
  total: number;

  @ApiProperty({ description: 'Number of open tickets' })
  open: number;

  @ApiProperty({ description: 'Number of tickets in progress' })
  inProgress: number;

  @ApiProperty({ description: 'Number of resolved tickets' })
  resolved: number;

  @ApiProperty({ description: 'Number of high priority tickets' })
  highPriority: number;

  @ApiProperty({ description: 'Number of critical priority tickets' })
  critical: number;

  @ApiProperty({ description: 'Average ticket resolution time in hours' })
  averageResolutionTime: number;

  @ApiProperty({ description: 'Number of overdue tickets' })
  overdue: number;
}

export class InvoiceStatsDto {
  @ApiProperty({ description: 'Total number of invoices' })
  total: number;

  @ApiProperty({ description: 'Number of pending invoices' })
  pending: number;

  @ApiProperty({ description: 'Number of overdue invoices' })
  overdue: number;

  @ApiProperty({ description: 'Number of paid invoices' })
  paid: number;

  @ApiProperty({ description: 'Total amount of all invoices' })
  totalAmount: number;

  @ApiProperty({ description: 'Total amount of pending invoices' })
  pendingAmount: number;

  @ApiProperty({ description: 'Total amount of overdue invoices' })
  overdueAmount: number;

  @ApiProperty({ description: 'Total amount of paid invoices' })
  paidAmount: number;
}

export class MilestoneStatsDto {
  @ApiProperty({ description: 'Total number of milestones' })
  total: number;

  @ApiProperty({ description: 'Number of completed milestones' })
  completed: number;

  @ApiProperty({ description: 'Number of overdue milestones' })
  overdue: number;

  @ApiProperty({ description: 'Number of milestones due this week' })
  dueThisWeek: number;

  @ApiProperty({ description: 'Number of milestones due this month' })
  dueThisMonth: number;

  @ApiProperty({ description: 'Milestone completion rate percentage' })
  completionRate: number;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ description: 'Project statistics', type: ProjectStatsDto })
  projects: ProjectStatsDto;

  @ApiProperty({ description: 'Ticket statistics', type: TicketStatsDto })
  tickets: TicketStatsDto;

  @ApiProperty({ description: 'Invoice statistics', type: InvoiceStatsDto })
  invoices: InvoiceStatsDto;

  @ApiProperty({ description: 'Milestone statistics', type: MilestoneStatsDto })
  milestones: MilestoneStatsDto;

  @ApiProperty({ description: 'Dashboard last updated timestamp' })
  lastUpdated: Date;

  @ApiProperty({ description: 'Time range used for statistics' })
  timeRange: DashboardTimeRange;
}

export class RecentActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({
    description: 'Activity type',
    enum: ['project', 'ticket', 'milestone', 'invoice'],
  })
  type: 'project' | 'ticket' | 'milestone' | 'invoice';

  @ApiProperty({ description: 'Activity title' })
  title: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Activity status' })
  status: string;

  @ApiProperty({ description: 'Activity creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Activity priority' })
  priority?: string;

  @ApiPropertyOptional({ description: 'Activity due date' })
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Associated project ID' })
  projectId?: string;

  @ApiPropertyOptional({ description: 'Associated project name' })
  projectName?: string;
}

export class ProjectOverviewDto {
  @ApiProperty({ description: 'Project ID' })
  id: string;

  @ApiProperty({ description: 'Project name' })
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  description?: string;

  @ApiProperty({ description: 'Project status' })
  status: string;

  @ApiProperty({ description: 'Project completion percentage' })
  progress: number;

  @ApiProperty({ description: 'Total number of milestones' })
  totalMilestones: number;

  @ApiProperty({ description: 'Number of completed milestones' })
  completedMilestones: number;

  @ApiProperty({ description: 'Number of open tickets' })
  openTickets: number;

  @ApiProperty({ description: 'Number of high priority tickets' })
  highPriorityTickets: number;

  @ApiProperty({ description: 'Project creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Project last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Project start date' })
  startAt?: Date;

  @ApiPropertyOptional({ description: 'Project due date' })
  dueAt?: Date;

  @ApiPropertyOptional({ description: 'Next milestone due date' })
  nextMilestoneDue?: Date;

  @ApiPropertyOptional({ description: 'Project health indicator' })
  health?: 'excellent' | 'good' | 'at-risk' | 'critical';
}

export class DashboardKpiDto {
  @ApiProperty({ description: 'Client satisfaction score (NPS)' })
  clientSatisfaction: number;

  @ApiProperty({ description: 'Average project delivery time in days' })
  averageDeliveryTime: number;

  @ApiProperty({
    description: 'Ticket response time SLA compliance percentage',
  })
  slaCompliance: number;

  @ApiProperty({ description: 'Revenue growth percentage' })
  revenueGrowth: number;

  @ApiProperty({ description: 'Client retention rate percentage' })
  clientRetentionRate: number;

  @ApiProperty({ description: 'Project success rate percentage' })
  projectSuccessRate: number;
}
