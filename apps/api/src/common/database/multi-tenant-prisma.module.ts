import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { MultiTenantPrismaService } from './multi-tenant-prisma.service';

@Module({
  imports: [PrismaModule],
  providers: [MultiTenantPrismaService],
  exports: [MultiTenantPrismaService],
})
export class MultiTenantPrismaModule {}