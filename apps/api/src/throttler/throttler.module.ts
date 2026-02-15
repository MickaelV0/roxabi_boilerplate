import { Logger, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { CustomThrottlerGuard } from './custom-throttler.guard.js'
import { UpstashThrottlerStorage } from './upstash-throttler-storage.js'

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('ThrottlerConfigModule')
        const rateLimitEnabled = config.get<string>('RATE_LIMIT_ENABLED', 'true')
        if (rateLimitEnabled === 'false') {
          logger.warn(
            'Rate limiting is DISABLED (RATE_LIMIT_ENABLED=false). This should only be used for emergencies.'
          )
        }

        const upstashUrl = config.get<string>('KV_REST_API_URL')
        const upstashToken = config.get<string>('KV_REST_API_TOKEN')
        const upstashConfigured = Boolean(upstashUrl && upstashToken)

        if (upstashConfigured) {
          logger.log('Rate limiting using Upstash Redis storage')
        } else {
          logger.warn('Rate limiting using in-memory storage — not suitable for production')
        }

        return {
          throttlers: [
            {
              name: 'global',
              ttl: config.get<number>('RATE_LIMIT_GLOBAL_TTL', 60_000),
              limit: config.get<number>('RATE_LIMIT_GLOBAL_LIMIT', 60),
              setHeaders: false,
            },
            {
              name: 'auth',
              ttl: config.get<number>('RATE_LIMIT_AUTH_TTL', 60_000),
              limit: config.get<number>('RATE_LIMIT_AUTH_LIMIT', 5),
              blockDuration: config.get<number>('RATE_LIMIT_AUTH_BLOCK_DURATION', 300_000),
              setHeaders: false,
            },
          ],
          // Intentional: UpstashThrottlerStorage is a stateless adapter (no DI dependencies), so we instantiate it directly instead of going through the NestJS container
          storage: upstashConfigured
            ? new UpstashThrottlerStorage(upstashUrl as string, upstashToken as string)
            : undefined,
        }
      },
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: CustomThrottlerGuard }],
})
export class ThrottlerConfigModule {}
