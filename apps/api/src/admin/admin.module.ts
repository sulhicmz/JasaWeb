import { Module } from '@nestjs/common';
import { AccountManagementController } from './account-management.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/database/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AccountManagementController],
})
export class AdminModule {}
