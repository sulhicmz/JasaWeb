import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateOnboardingStateDto {
  @IsString()
  userId!: string;

  @IsString()
  organizationId!: string;

  @IsString()
  @IsOptional()
  currentStep?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  completedSteps?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skippedSteps?: string[];

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsObject()
  @IsOptional()
  preferences?: Record<string, any>;
}
