import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import type { ThrottlerStorage } from '@nestjs/throttler'
import { Redis } from '@upstash/redis'

@Injectable()
export class UpstashThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(UpstashThrottlerStorage.name)
  private readonly redis: Redis

  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token })
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string
  ) {
    const ttlSeconds = Math.ceil(ttl / 1000)
    const blockKey = `${key}:blocked`

    try {
      // Check if currently blocked
      const blockTtl = await this.redis.ttl(blockKey)
      if (blockTtl > 0) {
        return {
          totalHits: limit + 1,
          timeToExpire: blockTtl * 1000,
          isBlocked: true,
          timeToBlockExpire: blockTtl * 1000,
        }
      }

      // Atomic INCR + EXPIRE + TTL via single pipeline to prevent orphaned keys without TTL
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, ttlSeconds)
      pipeline.ttl(key)
      const results = await pipeline.exec<[number, number, number]>()

      const totalHits = results[0]
      // results[1] is EXPIRE result (0 or 1), not needed
      const currentTtl = results[2]

      const timeToExpire = currentTtl * 1000

      // If over limit and blockDuration is configured, set the block key
      if (totalHits > limit && blockDuration > 0) {
        const blockDurationSeconds = Math.ceil(blockDuration / 1000)
        await this.redis.set(blockKey, 1, { ex: blockDurationSeconds })
        return {
          totalHits,
          timeToExpire,
          isBlocked: true,
          timeToBlockExpire: blockDuration,
        }
      }

      return {
        totalHits,
        timeToExpire,
        isBlocked: false,
        timeToBlockExpire: 0,
      }
    } catch (error) {
      // Tier-aware fail strategy
      if (throttlerName === 'global') {
        this.logger.warn(
          `Redis unavailable for global tier, failing open: ${error instanceof Error ? error.message : String(error)}`
        )
        return {
          totalHits: 0,
          timeToExpire: 0,
          isBlocked: false,
          timeToBlockExpire: 0,
        }
      }

      // Auth tier: fail closed
      this.logger.error(
        `Redis unavailable for auth tier, failing closed: ${error instanceof Error ? error.message : String(error)}`
      )
      throw new ServiceUnavailableException('Rate limiting service temporarily unavailable')
    }
  }
}
