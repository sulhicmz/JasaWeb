import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsInt,
} from 'class-validator';
import { OnboardingStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(OnboardingStatus)
  onboardingStatus?: OnboardingStatus;

  @IsOptional()
  @IsInt()
  onboardingStep?: number;

  @IsOptional()
  onboardingCompletedAt?: Date;

  @IsOptional()
  onboardingPreferences?: Record<string, any>;
}
