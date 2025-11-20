import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
  IsInt,
} from 'class-validator';

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export class User {
  id: string = '';
  email: string = '';
  name: string = '';
  password: string = '';
  profilePicture?: string;
  onboardingStatus: OnboardingStatus = OnboardingStatus.NOT_STARTED;
  onboardingStep: number = 0;
  onboardingCompletedAt?: Date;
  onboardingPreferences?: Record<string, any>;
  isActive: boolean = true;
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
