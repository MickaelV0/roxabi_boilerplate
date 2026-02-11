import { text, timestamp } from 'drizzle-orm/pg-core'
import { organizations } from './auth.schema.js'

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
 * Tenant column for Row-Level Security (RLS).
 *
 * Usage:
 * 1. Spread `...tenantColumn` in your Drizzle schema definition
 * 2. In the migration, call `SELECT create_tenant_rls_policy('your_table_name')`
 * 3. Use `TenantService.query()` in your service to run tenant-scoped queries
 *
 * The `tenant_id` maps to `organizations.id` — the organization IS the tenant.
 * RLS policies enforce isolation via `current_setting('app.tenant_id', true)`.
 */
export const tenantColumn = {
  tenantId: text('tenant_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
}
