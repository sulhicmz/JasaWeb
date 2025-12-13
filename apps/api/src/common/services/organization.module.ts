import { Module } from '@nestjs/common';
import { OrganizationMembershipService } from './organization-membership.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OrganizationMembershipService],
  exports: [OrganizationMembershipService],
})
export class OrganizationModule {}
