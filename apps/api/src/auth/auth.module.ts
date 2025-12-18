import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../users/user.module';
import { PrismaModule } from '../common/database/prisma.module';
import { RefreshTokenService } from './refresh-token.service';
import { PasswordService } from './password.service';
import { getRequiredEnv } from '../common/config/env.validation';

@Module({
  imports: [
    UserModule,
    PrismaModule,
    JwtModule.register({
      secret: getRequiredEnv('JWT_SECRET'),
      signOptions: {
        expiresIn: '60m',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    PasswordService,
    LocalStrategy,
    JwtStrategy,
  ],
  exports: [AuthService, RefreshTokenService, PasswordService, JwtModule],
})
export class AuthModule {}
