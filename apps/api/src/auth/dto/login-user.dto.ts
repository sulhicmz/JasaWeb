import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginResponseDto {
  access_token!: string;
  refreshToken!: string;
  expiresAt!: Date;
  user!: {
    id: string;
    email: string;
    name?: string;
    profilePicture?: string;
  };
}

export class LockoutInfoDto {
  isLocked!: boolean;
  remainingAttempts!: number;
  lockoutExpiresAt?: Date;
  maxAttempts!: number;
  lockoutDurationMinutes!: number;
}
