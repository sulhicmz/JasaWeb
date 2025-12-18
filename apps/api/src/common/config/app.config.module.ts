import { Module } from '@nestjs/common';
import { AppConfigService } from './app.config.service';

@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
  global: true, // Make it available throughout the application
})
export class AppConfigModule {}
