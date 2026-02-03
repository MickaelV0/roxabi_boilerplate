import { text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Reusable timestamp columns for all tables
 */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
}

/**
 * Tenant column for Row-Level Security (RLS)
 * All tenant-aware tables should include this
 */
export const tenantColumn = {
  tenantId: text('tenant_id').notNull(),
}
