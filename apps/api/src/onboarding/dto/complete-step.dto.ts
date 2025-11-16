import { IsString, IsOptional, IsObject } from 'class-validator';

export class CompleteStepDto {
  @IsString()
  stepKey!: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
