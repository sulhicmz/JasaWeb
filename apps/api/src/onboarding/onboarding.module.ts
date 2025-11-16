import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PrismaModule } from '../common/database/prisma.module';
import { EmailModule } from '../common/services/email.module';
import { AuditModule } from '../common/services/audit.module';

@Module({
  imports: [PrismaModule, EmailModule, AuditModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
