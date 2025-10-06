import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/database/prisma.module';
import { MultiTenantPrismaService } from './database/multi-tenant-prisma.service';

@Module({
  imports: [PrismaModule],
  providers: [MultiTenantPrismaService],
  exports: [MultiTenantPrismaService],
})
export class MultiTenantPrismaModule {}