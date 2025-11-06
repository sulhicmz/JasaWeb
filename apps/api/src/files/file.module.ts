import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MultiTenantPrismaModule } from '../common/database/multi-tenant-prisma.module';
<<<<<<< HEAD
=======
import { FileStorageService } from '../common/services/file-storage.service';
import { LocalFileStorageService } from '../common/services/local-file-storage.service';
>>>>>>> origin/main

@Module({
  imports: [MultiTenantPrismaModule],
  controllers: [FileController],
<<<<<<< HEAD
  providers: [FileService],
=======
  providers: [FileService, FileStorageService, LocalFileStorageService],
>>>>>>> origin/main
  exports: [FileService],
})
export class FileModule {}