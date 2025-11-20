import { Module } from '@nestjs/common';
import { DataEncryptionService } from './data-encryption.service';
import { PrismaModule } from '../../common/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DataEncryptionService],
  exports: [DataEncryptionService],
})
export class DataEncryptionModule {}
