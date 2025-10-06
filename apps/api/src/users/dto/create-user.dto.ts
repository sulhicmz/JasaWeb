import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string = '';

  @IsString()
  @MinLength(2)
  name: string = '';

  @IsString()
  @MinLength(6)
  password: string = '';

  @IsOptional()
  @IsString()
  profilePicture?: string;
}