import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { PrismaModule } from '../database/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { EnvironmentService } from '../config/environment.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (envService: EnvironmentService) => ({
        secret: envService.jwtSecret,
        signOptions: {
          expiresIn: '60m',
        },
      }),
      inject: [EnvironmentService],
    }),
  ],
  providers: [EnvironmentService, SessionService],
  exports: [SessionService],
})
export class SessionModule {}
