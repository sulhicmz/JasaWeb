import { Module, Global } from '@nestjs/common';
import { EnvironmentService } from './environment.service';

@Global()
@Module({
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}
