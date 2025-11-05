import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      useFactory: () => ([
        {
          ttl: Number.parseInt(process.env.THROTTLE_TTL || '', 10) || 60, // Time window in seconds
          limit: Number.parseInt(process.env.THROTTLE_LIMIT || '', 10) || 10, // Max requests per window
        },
      ]),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class ThrottlerConfigModule {}