import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './common/config/env.validation';
import securityConfig from './common/config/security.config';
import appConfig from './common/config/app.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { ProjectModule } from './projects/project.module';
import { MilestoneModule } from './milestones/milestone.module';
import { TicketModule } from './tickets/ticket.module';
import { InvoiceModule } from './invoices/invoice.module';
import { FileModule } from './files/file.module';
import { ApprovalModule } from './approvals/approval.module';
import { EmailModule } from './common/services/email.module';
import { AuditModule } from './common/services/audit.module';
import { ErrorHandlingModule } from './common/services/error-handling.module';
import { SessionModule } from './common/services/session.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/database/prisma.module';
import { MultiTenantPrismaModule } from './common/database/multi-tenant-prisma.module';
import { MultiTenantGuard } from './common/guards/multi-tenant.guard';
import { MultiTenantMiddleware } from './common/middleware/multi-tenant.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { HealthModule } from './health/health.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
      load: [securityConfig, appConfig],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const appConfig = configService.get('app');
        return {
          ttl: appConfig.cache.ttl,
          max: appConfig.cache.max,
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const appConfig = configService.get('app');
        return [
          {
            ttl: appConfig.throttling.ttl,
            limit: appConfig.throttling.limit,
          },
        ];
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ProjectModule,
    MilestoneModule,
    TicketModule,
    InvoiceModule,
    FileModule,
    ApprovalModule,
    EmailModule,
    AuditModule,
    ErrorHandlingModule,
    SessionModule,
    HealthModule,
    AnalyticsModule,
    KnowledgeBaseModule,
    DashboardModule,
    PrismaModule,
    MultiTenantPrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: MultiTenantGuard,
    },
    RolesGuard, // Register RolesGuard for use with @UseGuards(RolesGuard)
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggingMiddleware, MultiTenantMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
