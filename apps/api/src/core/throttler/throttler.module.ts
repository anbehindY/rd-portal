import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [NestThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  exports: [NestThrottlerModule],
})
export class ThrottlerModule {}
