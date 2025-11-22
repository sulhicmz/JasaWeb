import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../users/user.module';
import { PrismaModule } from '../common/database/prisma.module';
import { RefreshTokenService } from './refresh-token.service';

@Module({
  imports: [
    UserModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN || '60m') as any,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService, LocalStrategy, JwtStrategy],
  exports: [AuthService, RefreshTokenService],
})
export class AuthModule {}
