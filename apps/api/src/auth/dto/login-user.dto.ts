import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
<<<<<<< HEAD
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
=======
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
>>>>>>> origin/main
}