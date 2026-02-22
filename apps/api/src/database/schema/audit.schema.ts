import { relations } from 'drizzle-orm'
import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { organizations, users } from './auth.schema.js'
import { timestamps } from './timestamps.js'

const genId = () => crypto.randomUUID()

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey().$defaultFn(genId),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id),
    actorType: text('actor_type').notNull(),
    impersonatorId: text('impersonator_id').references(() => users.id),
    organizationId: text('organization_id').references(() => organizations.id),
    action: text('action').notNull(),
    resource: text('resource').notNull(),
    resourceId: text('resource_id').notNull(),
    before: jsonb('before').$type<Record<string, unknown>>(),
    after: jsonb('after').$type<Record<string, unknown>>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    index('idx_audit_logs_actor').on(table.actorId),
    index('idx_audit_logs_org').on(table.organizationId),
    index('idx_audit_logs_timestamp').on(table.timestamp.desc()),
    index('idx_audit_logs_action').on(table.action),
  ]
)

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
  impersonator: one(users, {
    fields: [auditLogs.impersonatorId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
}))
