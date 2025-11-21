import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class UpdateOnboardingStateDto {
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
