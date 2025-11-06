import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
<<<<<<< HEAD
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

=======
import { ThrottlerModule, ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

>>>>>>> origin/main
@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
<<<<<<< HEAD
      useFactory: () => ({
        ttl: parseInt(process.env.THROTTLE_TTL) || 60, // Time window in seconds
        limit: parseInt(process.env.THROTTLE_LIMIT) || 10, // Max requests per window
      }),
=======
      useFactory: (): ThrottlerModuleOptions => ([
        {
          ttl: parseNumber(process.env.THROTTLE_TTL, 60), // Time window in seconds
          limit: parseNumber(process.env.THROTTLE_LIMIT, 10), // Max requests per window
        },
      ]),
>>>>>>> origin/main
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