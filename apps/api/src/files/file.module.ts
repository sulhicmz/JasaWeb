import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';

@Module({
  imports: [MultiTenantPrismaModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}