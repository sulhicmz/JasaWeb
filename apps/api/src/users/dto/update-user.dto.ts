import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

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
}