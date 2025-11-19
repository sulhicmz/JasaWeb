import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceMonitoringService } from '../common/services/performance-monitoring.service';
import { DatabaseOptimizationService } from '../common/services/database-optimization.service';
import { EnhancedCacheService } from '../common/services/enhanced-cache.service';
import { EnhancedCacheConfigModule } from '../common/services/enhanced-cache-config.module';

@Module({
  imports: [EnhancedCacheConfigModule],
  controllers: [PerformanceController],
  providers: [
    PerformanceMonitoringService,
    DatabaseOptimizationService,
    EnhancedCacheService,
  ],
  exports: [
    PerformanceMonitoringService,
    DatabaseOptimizationService,
    EnhancedCacheService,
  ],
})
export class PerformanceModule {}
