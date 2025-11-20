import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './collaboration.service';
import { PrismaModule } from '../common/database/prisma.module';
import { AuditModule } from '../common/services/audit.module';
import { UserModule } from '../users/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuditModule, UserModule, AuthModule],
  providers: [CollaborationGateway, CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
