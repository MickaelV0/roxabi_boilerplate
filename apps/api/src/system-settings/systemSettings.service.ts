import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { systemSettings } from '../database/schema/systemSettings.schema.js'

@Injectable()
export class SystemSettingsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getValue<T = unknown>(key: string): Promise<T | null> {
    const rows = await this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1)

    const row = rows[0]
    if (!row) return null
    return row.value as T
  }

  async getAll() {
    return this.db.select().from(systemSettings)
  }

  async getByCategory(category: string) {
    return this.db.select().from(systemSettings).where(eq(systemSettings.category, category))
  }
}
