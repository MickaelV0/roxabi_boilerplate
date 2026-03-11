import { Inject, Injectable } from '@nestjs/common'
import type { SystemSetting } from '@repo/types'
import { eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB, type DrizzleTx } from '../../database/drizzle.provider.js'
import { systemSettings } from '../../database/schema/systemSettings.schema.js'
import type { SystemSettingsRepository } from '../systemSettings.repository.js'

// RLS-BYPASS: superadmin-only endpoint — @Roles('superadmin') enforced at controller level

function toSystemSetting(row: typeof systemSettings.$inferSelect): SystemSetting {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    type: row.type as SystemSetting['type'],
    name: row.name,
    description: row.description ?? null,
    category: row.category,
    metadata: row.metadata as SystemSetting['metadata'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

@Injectable()
export class DrizzleSystemSettingsRepository implements SystemSettingsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByKey(key: string, tx?: DrizzleTx): Promise<SystemSetting | null> {
    const qb = tx ?? this.db
    const rows = await qb.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1)
    return rows[0] ? toSystemSetting(rows[0]) : null
  }

  async findAll(tx?: DrizzleTx): Promise<SystemSetting[]> {
    const qb = tx ?? this.db
    const rows = await qb.select().from(systemSettings)
    return rows.map(toSystemSetting)
  }

  async findByCategory(category: string, tx?: DrizzleTx): Promise<SystemSetting[]> {
    const qb = tx ?? this.db
    const rows = await qb.select().from(systemSettings).where(eq(systemSettings.category, category))
    return rows.map(toSystemSetting)
  }

  async updateByKey(key: string, value: unknown, tx?: DrizzleTx): Promise<SystemSetting | null> {
    const qb = tx ?? this.db
    const rows = await qb
      .update(systemSettings)
      .set({ value })
      .where(eq(systemSettings.key, key))
      .returning()
    return rows[0] ? toSystemSetting(rows[0]) : null
  }
}
