import { Logger, ServiceUnavailableException } from '@nestjs/common'
import type { ThrottlerStorage } from '@nestjs/throttler'
import { Redis } from '@upstash/redis'

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
    const blockKey = `${key}:blocked`

    try {
      const blockedResult = await this.checkBlocked(blockKey, limit)
      if (blockedResult) return blockedResult

      const { totalHits, timeToExpire } = await this.atomicIncrement(key, ttl)

      if (totalHits > limit && blockDuration > 0) {
        await this.setBlockKey(blockKey, blockDuration)
        return { totalHits, timeToExpire, isBlocked: true, timeToBlockExpire: blockDuration }
      }

      return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 }
    } catch (error) {
      return this.handleRedisError(error, throttlerName)
    }
  }

  private async checkBlocked(blockKey: string, limit: number) {
    const blockTtl = await this.redis.ttl(blockKey)
    if (blockTtl <= 0) return null
    return {
      totalHits: limit + 1,
      timeToExpire: blockTtl * 1000,
      isBlocked: true,
      timeToBlockExpire: blockTtl * 1000,
    }
  }

  private async atomicIncrement(key: string, ttl: number) {
    const ttlSeconds = Math.ceil(ttl / 1000)
    const pipeline = this.redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, ttlSeconds)
    pipeline.ttl(key)
    const results = await pipeline.exec<[number, number, number]>()
    return { totalHits: results[0], timeToExpire: results[2] * 1000 }
  }

  private async setBlockKey(blockKey: string, blockDuration: number) {
    const blockDurationSeconds = Math.ceil(blockDuration / 1000)
    await this.redis.set(blockKey, 1, { ex: blockDurationSeconds })
  }

  private handleRedisError(
    error: unknown,
    throttlerName: string
  ): {
    totalHits: number
    timeToExpire: number
    isBlocked: boolean
    timeToBlockExpire: number
  } {
    const message = error instanceof Error ? error.message : String(error)

    if (throttlerName === 'global') {
      this.logger.warn(`Redis unavailable for global tier, failing open: ${message}`)
      return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 }
    }

    this.logger.error(`Redis unavailable for auth tier, failing closed: ${message}`)
    throw new ServiceUnavailableException('Rate limiting service temporarily unavailable')
  }
}
