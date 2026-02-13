import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { Redis } from '@upstash/redis'

interface ThrottlerStorageRecord {
  totalHits: number
  timeToExpire: number
  isBlocked: boolean
  timeToBlockExpire: number
}

@Injectable()
export class UpstashThrottlerStorage {
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
  ): Promise<ThrottlerStorageRecord> {
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

      // Atomic INCR + EXPIRE via pipeline
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.ttl(key)
      const results = await pipeline.exec<[number, number]>()

      const totalHits = results[0]
      let currentTtl = results[1]

      // If this is the first hit (TTL is -1 means no expiry set), set the expiry
      if (currentTtl === -1) {
        await this.redis.expire(key, ttlSeconds)
        currentTtl = ttlSeconds
      }

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
