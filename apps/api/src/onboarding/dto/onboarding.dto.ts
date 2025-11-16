import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteOnboardingDto {
  @ApiProperty({ description: 'Organization information' })
  organization!: {
    name: string;
    email: string;
    timezone: string;
    autoMilestones: boolean;
    weeklyReports: boolean;
    slackNotifications: boolean;
  };

  @ApiProperty({ description: 'Team members to invite' })
  team!: Array<{
    email: string;
    role: string;
  }>;

  @ApiProperty({ description: 'First project information' })
  project!: {
    name: string;
    description: string;
    template: string;
    startDate: string;
    endDate: string;
  };

  @ApiProperty({ description: 'Integration preferences' })
  integrations!: {
    email: boolean;
    slack: boolean;
    googleCalendar: boolean;
    googleDrive: boolean;
  };
}

export class UpdateProgressDto {
  @ApiProperty({ description: 'Current onboarding step' })
  @IsString()
  step!: string;

  @ApiProperty({ description: 'Step data' })
  data: any;
}

export class UpdateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Billing email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Timezone' })
  @IsString()
  timezone!: string;

  @ApiPropertyOptional({ description: 'Auto-create milestones' })
  @IsBoolean()
  @IsOptional()
  autoMilestones?: boolean;

  @ApiPropertyOptional({ description: 'Weekly reports' })
  @IsBoolean()
  @IsOptional()
  weeklyReports?: boolean;

  @ApiPropertyOptional({ description: 'Slack notifications' })
  @IsBoolean()
  @IsOptional()
  slackNotifications?: boolean;
}

export class TeamMemberDto {
  @ApiProperty({ description: 'Member email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Member role' })
  @IsString()
  role!: string;
}

export class InviteTeamDto {
  @ApiProperty({ description: 'Team members to invite', type: [TeamMemberDto] })
  @IsArray()
  members!: TeamMemberDto[];
}

export class CreateFirstProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Project template' })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiPropertyOptional({ description: 'Project start date' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Project end date' })
  @IsString()
  @IsOptional()
  endDate?: string;
}

export class UnlockAchievementDto {
  @ApiProperty({ description: 'Achievement ID' })
  @IsString()
  achievementId!: string;
}
