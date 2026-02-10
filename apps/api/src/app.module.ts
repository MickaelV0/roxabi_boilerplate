import { randomUUID } from 'node:crypto'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ClsModule } from 'nestjs-cls'
import { AppController } from './app.controller.js'
import { AuthModule } from './auth/auth.module.js'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js'
import { validate } from './config/env.validation.js'
import { DatabaseModule } from './database/database.module.js'
import { UserModule } from './user/user.module.js'

const CORRELATION_ID_PATTERN = /^[\w-]{1,128}$/

function extractCorrelationId(header: string | string[] | undefined): string | undefined {
  if (!header) return undefined
  const raw = Array.isArray(header) ? header[0] : header.split(',')[0]
  const value = raw?.trim()
  if (value && CORRELATION_ID_PATTERN.test(value)) return value
  return undefined
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
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
        setup: (_cls, _req: FastifyRequest, res: FastifyReply) => {
          res.header('x-correlation-id', _cls.getId())
        },
      },
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
