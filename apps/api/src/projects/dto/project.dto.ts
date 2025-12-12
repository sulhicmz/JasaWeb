import { IsString, IsEnum, IsOptional, IsDate } from 'class-validator';
import { ProjectStatus } from '../../common/enums';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsDate()
  @IsOptional()
  startAt?: Date;

  @IsDate()
  @IsOptional()
  dueAt?: Date;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsDate()
  @IsOptional()
  startAt?: Date;

  @IsDate()
  @IsOptional()
  dueAt?: Date;
}
