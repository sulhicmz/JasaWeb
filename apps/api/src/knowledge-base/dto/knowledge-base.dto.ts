import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum KbArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export class CreateKbCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateKbCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CreateKbTagDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateKbArticleDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsEnum(KbArticleStatus)
  status?: KbArticleStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];
}

export class UpdateKbArticleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsEnum(KbArticleStatus)
  status?: KbArticleStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];
}

export class CreateKbFeedbackDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  helpful?: boolean;
}

export class KbSearchDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
