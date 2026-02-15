import { randomUUID } from 'node:crypto'
import type { ServerResponse } from 'node:http'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import type { FastifyRequest } from 'fastify'
import { ClsModule } from 'nestjs-cls'
import { AppController } from './app.controller.js'
import { AuthModule } from './auth/auth.module.js'
import { extractCorrelationId } from './common/correlation-id.util.js'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js'
import { validate } from './config/env.validation.js'
import { DatabaseModule } from './database/database.module.js'
import { RbacModule } from './rbac/rbac.module.js'
import { TenantModule } from './tenant/tenant.module.js'
import { ThrottlerConfigModule } from './throttler/throttler.module.js'
import { UserModule } from './user/user.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env'],
      validate,
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: FastifyRequest) => {
          return extractCorrelationId(req.headers['x-correlation-id']) ?? randomUUID()
        },
        setup: (cls, _req: FastifyRequest, res: ServerResponse) => {
          res.setHeader('x-correlation-id', cls.getId())
        },
      },
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    TenantModule,
    UserModule,
    RbacModule,
    ThrottlerConfigModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
