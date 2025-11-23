import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './common/config/env.validation';
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

const parseEnvNumber = (
  value: string | undefined,
  fallback: number
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        ttl: parseEnvNumber(process.env.CACHE_TTL, 5), // Time to live in seconds
        max: parseEnvNumber(process.env.CACHE_MAX, 100), // Maximum number of items in cache
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseEnvNumber(process.env.THROTTLE_TTL, 60), // Time window in seconds
        limit: parseEnvNumber(process.env.THROTTLE_LIMIT, 10), // Max requests per window
      },
    ]),
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
