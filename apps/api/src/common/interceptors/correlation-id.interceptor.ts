import { randomUUID } from 'node:crypto'
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { Observable } from 'rxjs'

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<FastifyRequest>()
    const response = ctx.getResponse<FastifyReply>()

    // Get correlation ID from header or generate new one
    const correlationId = (request.headers['x-correlation-id'] as string) || randomUUID()

    // Set on request for use in handlers
    request.headers['x-correlation-id'] = correlationId

    // Set on response header
    response.header('x-correlation-id', correlationId)

    return next.handle()
  }
}
