import { Inject, Injectable } from '@nestjs/common'
import { desc, eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { featureFlags } from '../database/schema/featureFlags.schema.js'

@Injectable()
export class FeatureFlagService {
  private static readonly CACHE_TTL_MS = 60_000

  /**
   * Per-instance in-memory cache with 60s TTL.
   * In multi-instance deployments, other instances may serve stale values
   * for up to 60s after a write on a different instance.
   */
  private cache = new Map<string, { value: boolean; expiresAt: number }>()

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async isEnabled(key: string): Promise<boolean> {
    const cached = this.cache.get(key)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value
    }

    const rows = await this.db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1)

    const row = rows[0]
    if (!row) return false

    this.cache.set(key, {
      value: row.enabled,
      expiresAt: Date.now() + FeatureFlagService.CACHE_TTL_MS,
    })

    return row.enabled
  }

  async getAll() {
    return this.db.select().from(featureFlags).orderBy(desc(featureFlags.createdAt))
  }

  async getById(id: string) {
    const rows = await this.db.select().from(featureFlags).where(eq(featureFlags.id, id)).limit(1)
    return rows[0]
  }

  async create(data: { name: string; key: string; description?: string }) {
    const rows = await this.db
      .insert(featureFlags)
      .values({
        name: data.name,
        key: data.key,
        description: data.description,
      })
      .returning()

    this.cache.delete(data.key)

    return rows[0]
  }

  async update(id: string, data: { name?: string; description?: string; enabled?: boolean }) {
    const rows = await this.db
      .update(featureFlags)
      .set(data)
      .where(eq(featureFlags.id, id))
      .returning()

    if (rows[0]?.key) {
      this.cache.delete(rows[0].key)
    }

    return rows[0]
  }

  async delete(id: string): Promise<void> {
    const rows = await this.db.delete(featureFlags).where(eq(featureFlags.id, id)).returning()

    if (rows[0]?.key) {
      this.cache.delete(rows[0].key)
    }
  }
}
