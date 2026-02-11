import { boolean, index, pgTable, primaryKey, text, unique } from 'drizzle-orm/pg-core'
import { tenantColumn, timestamps } from './base.js'

const genId = () => crypto.randomUUID()

/**
 * Global permissions table (not tenant-scoped).
 * Seeded via migration — not editable by tenants.
 */
export const permissions = pgTable(
  'permissions',
  {
    id: text('id').primaryKey().$defaultFn(genId),
    resource: text('resource').notNull(),
    action: text('action').notNull(),
    description: text('description').notNull(),
    ...timestamps,
  },
  (table) => [unique('permissions_resource_action_unique').on(table.resource, table.action)]
)

/**
 * Tenant-scoped roles table.
 * Default roles (Owner, Admin, Member, Viewer) seeded per org on creation.
 * Custom roles can be created by Admins/Owners.
 */
export const roles = pgTable(
  'roles',
  {
    id: text('id').primaryKey().$defaultFn(genId),
    ...tenantColumn,
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    unique('roles_tenant_slug_unique').on(table.tenantId, table.slug),
    index('roles_tenant_id_idx').on(table.tenantId),
  ]
)

/**
 * Join table: role ↔ permission.
 * Tenant-scoped via role FK (roles have tenant_id).
 */
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index('role_permissions_role_id_idx').on(table.roleId),
    index('role_permissions_permission_id_idx').on(table.permissionId),
  ]
)
