import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LoggerModule } from './logger/logger.module';
import { ThrottlerModule } from './throttler/throttler.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, cache: true }),
    LoggerModule,
    ThrottlerModule,
    DatabaseModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
  exports: [ConfigModule, LoggerModule, ThrottlerModule, DatabaseModule],
})
export class CoreModule {}
