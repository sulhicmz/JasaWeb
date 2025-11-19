import { Module } from '@nestjs/common';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';
import { FileStorageService } from '../common/services/file-storage.service';
import { LocalFileStorageService } from '../common/services/local-file-storage.service';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [MultiTenantPrismaModule],
  controllers: [FileController],
  providers: [FileService, FileStorageService, LocalFileStorageService],
  exports: [FileService],
})
export class FileModule {}
