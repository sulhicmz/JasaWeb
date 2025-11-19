import { Module } from '@nestjs/common';
import { MultiTenantPrismaService } from './multi-tenant-prisma.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MultiTenantPrismaService],
  exports: [MultiTenantPrismaService],
})
export class MultiTenantPrismaModule {}
