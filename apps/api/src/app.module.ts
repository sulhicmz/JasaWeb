import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApprovalModule } from './approvals/approval.module';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './common/config/app.config.module';
import { validateEnv } from './common/config/env.validation';
import { EnvironmentModule } from './common/config/environment.module';
import { MultiTenantPrismaModule } from './common/database/multi-tenant-prisma.module';
import { PrismaModule } from './common/database/prisma.module';
import { MultiTenantGuard } from './common/guards/multi-tenant.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MultiTenantMiddleware } from './common/middleware/multi-tenant.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { SecurityModule } from './common/security/security.module';
import { AuditModule } from './common/services/audit.module';
import { EmailModule } from './common/services/email.module';
import { ErrorHandlingModule } from './common/services/error-handling.module';
import { OrganizationModule } from './common/services/organization.module';
import { RedisCacheModule } from './common/services/redis-cache.module';
import { SessionModule } from './common/services/session.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FileModule } from './files/file.module';
import { HealthModule } from './health/health.module';
import { InvoiceModule } from './invoices/invoice.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { MilestoneModule } from './milestones/milestone.module';
import { ProjectModule } from './projects/project.module';
import { TaskModule } from './tasks/task.module';
import { TicketModule } from './tickets/ticket.module';
import { UserModule } from './users/user.module';

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
    SecurityModule,
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
