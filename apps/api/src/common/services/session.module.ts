import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { PrismaModule } from '../database/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '60m',
      },
    }),
  ],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
