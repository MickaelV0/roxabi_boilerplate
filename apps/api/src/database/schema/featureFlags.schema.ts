import { boolean, pgTable, text } from 'drizzle-orm/pg-core'
import { timestamps } from './timestamps.js'

const genId = () => crypto.randomUUID()

export const featureFlags = pgTable('feature_flags', {
  id: text('id').primaryKey().$defaultFn(genId),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  enabled: boolean('enabled').notNull().default(false),
  ...timestamps,
})
