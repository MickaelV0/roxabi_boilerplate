-- RBAC Tables and Members role_id
-- Issue: #24 - Role-Based Access Control
--
-- Changes:
-- 1. Create global permissions table + seed 14 resource:action rows
-- 2. Create tenant-scoped roles table with RLS
-- 3. Create role_permissions join table
-- 4. Add role_id column to members with FK to roles
-- 5. Add index on members.role_id

-- 1. Create permissions table (global, not tenant-scoped)
CREATE TABLE IF NOT EXISTS "permissions" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "resource" text NOT NULL,
  "action" text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "permissions_resource_action_unique" UNIQUE ("resource", "action")
);

-- Seed the 14 resource:action permissions (+ 1 billing:read)
INSERT INTO "permissions" ("resource", "action", "description") VALUES
  ('users', 'read', 'View user profiles'),
  ('users', 'write', 'Edit user profiles'),
  ('users', 'delete', 'Delete users'),
  ('organizations', 'read', 'View organization details'),
  ('organizations', 'write', 'Edit organization settings'),
  ('organizations', 'delete', 'Delete organization'),
  ('members', 'read', 'View organization members'),
  ('members', 'write', 'Manage members and roles'),
  ('members', 'delete', 'Remove members from organization'),
  ('invitations', 'read', 'View pending invitations'),
  ('invitations', 'write', 'Send invitations'),
  ('invitations', 'delete', 'Revoke invitations'),
  ('roles', 'read', 'View roles and permissions'),
  ('roles', 'write', 'Create and edit roles'),
  ('roles', 'delete', 'Delete custom roles')
ON CONFLICT ("resource", "action") DO NOTHING;

-- 2. Create roles table (tenant-scoped)
CREATE TABLE IF NOT EXISTS "roles" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "roles_tenant_slug_unique" UNIQUE ("tenant_id", "slug")
);

CREATE INDEX "roles_tenant_id_idx" ON "roles" USING btree ("tenant_id");

-- Apply RLS policy to roles table
SELECT create_tenant_rls_policy('roles');

-- 3. Create role_permissions join table
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" text NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" text NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions" USING btree ("role_id");
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" USING btree ("permission_id");

-- 4. Add role_id column to members
ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "role_id" text REFERENCES "roles"("id") ON DELETE SET NULL;

-- 5. Add index on members.role_id
CREATE INDEX "members_role_id_idx" ON "members" USING btree ("role_id");
