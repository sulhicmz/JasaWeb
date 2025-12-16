import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { CreatableDto, ProjectStatus } from '../../common/dto/base.dto';

export class CreateProjectDto extends CreatableDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s\-_]+$/, {
    message: 'Project name contains invalid characters',
  })
  name!: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(ProjectStatus, {
    message:
      'Status must be one of: planning, in_progress, on_hold, completed, cancelled',
  })
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
