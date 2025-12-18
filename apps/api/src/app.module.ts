import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './common/config/env.validation';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisCacheModule } from './common/services/redis-cache.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './users/user.module';
import { ProjectModule } from './projects/project.module';
import { MilestoneModule } from './milestones/milestone.module';
import { TaskModule } from './tasks/task.module';
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
import { OrganizationModule } from './common/services/organization.module';
import { AppConfigModule } from './common/config/app.config.module';
import { EnvironmentModule } from './common/config/environment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    RedisCacheModule,
    EnvironmentModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60, // Time window in seconds
        limit: 10, // Max requests per window
      },
    ]),
    AuthModule,
    JwtModule,
    UserModule,
    ProjectModule,
    MilestoneModule,
    TaskModule,
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
    OrganizationModule,
    AppConfigModule,
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
