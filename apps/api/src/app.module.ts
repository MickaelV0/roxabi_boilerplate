import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller.js'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js'
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor.js'
import { validate } from './config/env.validation.js'
import { DatabaseModule } from './database/database.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate,
    }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
  ],
})
export class AppModule {}
