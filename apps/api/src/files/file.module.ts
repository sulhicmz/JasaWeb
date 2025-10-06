import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileStorageService } from '../common/services/file-storage.service';
import { LocalFileStorageService } from '../common/services/local-file-storage.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [FileController],
  providers: [
    FileStorageService,
    LocalFileStorageService,
    ConfigService,
  ],
  exports: [
    FileStorageService,
    LocalFileStorageService,
  ],
})
export class FileModule {}