/**
 * This file hosts shared types (ThrottlerMeta) and utilities (registerRateLimitHeadersHook)
 * alongside re-exports. It is intentionally kept as a module entry point rather than a pure
 * barrel file, which would be forbidden by our backend patterns.
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { AUTH_SENSITIVE_PATHS } from './custom-throttler.guard.js'

export { AUTH_SENSITIVE_PATHS, CustomThrottlerGuard } from './custom-throttler.guard.js'
export { ThrottlerConfigModule } from './throttler.module.js'
export { UpstashThrottlerStorage } from './upstash-throttler-storage.js'

/** Rate limit metadata stored on request by CustomThrottlerGuard, read by onSend hook and AllExceptionsFilter */
export interface ThrottlerMeta {
  limit: number
  remaining: number
  reset: number
  tierName: string
  tracker: string
}

/** Register the Fastify onSend hook that adds X-RateLimit-* headers (omitted for auth-sensitive paths) */
export function registerRateLimitHeadersHook(app: NestFastifyApplication): void {
  app
    .getHttpAdapter()
    .getInstance()
    .addHook(
      'onSend',
      (
        // biome-ignore lint/suspicious/noExplicitAny: Fastify raw request type
        request: any,
        reply: { header: (k: string, v: string) => void },
        _payload: unknown,
        done: () => void
      ) => {
        const meta = (request as Record<string, unknown>).throttlerMeta as ThrottlerMeta | undefined

        if (meta) {
          const path = (request.url as string)?.split('?')[0]
          const isAuthSensitive = AUTH_SENSITIVE_PATHS.some(
            (p) => path === p || path?.startsWith(`${p}/`)
          )
          if (!isAuthSensitive) {
            reply.header('X-RateLimit-Limit', String(meta.limit))
            reply.header('X-RateLimit-Remaining', String(meta.remaining))
            reply.header('X-RateLimit-Reset', String(meta.reset))
          }
        }

        done()
      }
    )
}
