import { Module } from '@nestjs/common';
import { SecurityConfigService } from './security-config.service';

@Module({
  providers: [SecurityConfigService],
  exports: [SecurityConfigService],
})
export class SecurityConfigModule {}
