import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { PasswordHashVersion } from '../../auth/password.service';

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
  @IsEnum(PasswordHashVersion)
  passwordHashVersion?: PasswordHashVersion;
}
