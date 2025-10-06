import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { PrismaModule } from '../common/database/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '60m' },
    }),
  ],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}