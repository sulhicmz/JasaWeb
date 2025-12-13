import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsUUID()
  organizationId!: string;
}
