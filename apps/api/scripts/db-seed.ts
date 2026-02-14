/**
 * Seed script — inserts dev essentials into a fresh database.
 *
 * Designed for fresh databases only (not idempotent).
 * For re-seeding, drop and recreate the database (db:branch:create --force).
 *
 * Seeds:
 *   1. User: dev@roxabi.local / password123
 *   2. Account: credential provider with hashed password
 *   3. Organization: "Roxabi Dev" (slug: roxabi-dev)
 *   4. Member: user → org (role: owner)
 *   5. RBAC: 4 default roles (Owner, Admin, Member, Viewer) with permissions
 *   6. Update member.roleId to Owner role
 *
 * Usage:
 *   DATABASE_URL=postgresql://... tsx scripts/db-seed.ts
 *   bun run db:seed  (reads DATABASE_URL from .env)
 */

// TODO: implement — connect to database using DATABASE_URL from env (postgres + drizzle)

// TODO: implement — create user (id, name, email, emailVerified)

// TODO: implement — hash password via `import { hashPassword } from 'better-auth/crypto'`

// TODO: implement — create account (userId, accountId, providerId: 'credential', password: hashedPassword)

// TODO: implement — create organization (id, name: 'Roxabi Dev', slug: 'roxabi-dev')

// TODO: implement — create member (userId, organizationId, role: 'owner')

// TODO: implement — import DEFAULT_ROLES from rbac.service and seed roles + permissions:
//   a. For each role: insert into roles table (tenantId: orgId, name, slug, description, isDefault: true)
//   b. Query permissions table, build resource:action → id map
//   c. Insert role_permissions for each role
//   d. Find Owner role ID, update member.roleId

// TODO: implement — log seed summary

console.log('db-seed: not yet implemented')
process.exit(1)
