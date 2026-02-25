import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import { timestamps } from './timestamps.js'

const genId = () => crypto.randomUUID()

export const systemSettings = pgTable(
  'system_settings',
  {
    id: text('id').primaryKey().$defaultFn(genId),
    key: text('key').notNull().unique(),
    value: jsonb('value').notNull(),
    type: text('type').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    category: text('category').notNull(),
    metadata: jsonb('metadata').$type<{ options?: string[] } | null>(),
    ...timestamps,
  },
  (table) => [index('idx_system_settings_category').on(table.category)]
)
