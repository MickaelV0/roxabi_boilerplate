import { timestamp } from 'drizzle-orm/pg-core'

/**
 * Reusable timestamp columns for all tables.
 *
 * Extracted into its own module to avoid circular dependencies
 * (base.ts imports from auth.schema.ts for tenantColumn).
 */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
}
