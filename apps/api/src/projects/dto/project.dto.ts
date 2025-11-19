import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'Website Redesign',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Project status',
    example: 'active',
    enum: ['draft', 'active', 'completed', 'on-hold', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Project start date',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startAt?: Date;

  @ApiPropertyOptional({
    description: 'Project due date',
    example: '2024-12-31T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dueAt?: Date;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Project name',
    example: 'Website Redesign v2',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Project status',
    example: 'completed',
    enum: ['draft', 'active', 'completed', 'on-hold', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Project start date',
    example: '2024-01-15T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startAt?: Date;

  @ApiPropertyOptional({
    description: 'Project due date',
    example: '2024-12-15T00:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  dueAt?: Date;
}
