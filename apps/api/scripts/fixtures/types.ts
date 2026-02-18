import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '../../src/database/schema/index.js'

type DbInstance = PostgresJsDatabase<typeof schema>

export type Tx = Parameters<Parameters<DbInstance['transaction']>[0]>[0]
export type Preset = 'minimal' | 'full'

export type FixtureContext = {
  userIds: string[]
  orgIds: string[]
  memberIds: string[]
  roleIdsByOrg: Map<string, Map<string, string>> // orgId -> (slug -> roleId)
}
