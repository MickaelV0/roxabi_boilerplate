import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core'
import { users } from './auth.schema.js'
import { timestamps } from './timestamps.js'

const genId = () => crypto.randomUUID()

export const consentRecords = pgTable(
  'consent_records',
  {
    id: text('id').primaryKey().$defaultFn(genId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    categories: jsonb('categories').notNull(),
    policyVersion: text('policy_version').notNull(),
    action: text('action').notNull(), // 'accepted' | 'rejected' | 'customized'
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    ...timestamps,
  },
  (table) => [index('consent_records_user_id_created_at_idx').on(table.userId, table.createdAt)]
)
