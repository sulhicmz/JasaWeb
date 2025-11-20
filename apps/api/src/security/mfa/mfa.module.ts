import { Module } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../common/database/prisma.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule],
  controllers: [MfaController],
  providers: [MfaService],
  exports: [MfaService],
})
export class MfaModule {}
