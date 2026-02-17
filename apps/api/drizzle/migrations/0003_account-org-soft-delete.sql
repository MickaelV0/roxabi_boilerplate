-- Account & Organization Soft-Delete
-- Issues: #201 - User Account Management, #202 - Organization Management
--
-- Changes:
-- 1. Add profile fields to users (firstName, lastName, fullNameCustomized, avatarSeed, avatarStyle)
-- 2. Add soft-delete columns to users (deletedAt, deleteScheduledFor)
-- 3. Add soft-delete columns to organizations (deletedAt, deleteScheduledFor)
-- 4. Create partial indexes for soft-delete queries
-- 5. Backfill firstName/lastName from existing name column

-- 1. Add profile fields to users
ALTER TABLE "users"
  ADD COLUMN "first_name" text,
  ADD COLUMN "last_name" text,
  ADD COLUMN "full_name_customized" boolean NOT NULL DEFAULT false,
  ADD COLUMN "avatar_seed" text,
  ADD COLUMN "avatar_style" text DEFAULT 'lorelei';

-- 2. Add soft-delete columns to users
ALTER TABLE "users"
  ADD COLUMN "deleted_at" timestamp with time zone,
  ADD COLUMN "delete_scheduled_for" timestamp with time zone;

-- 3. Add soft-delete columns to organizations
ALTER TABLE "organizations"
  ADD COLUMN "deleted_at" timestamp with time zone,
  ADD COLUMN "delete_scheduled_for" timestamp with time zone;

-- 4. Backfill firstName/lastName from name column
UPDATE "users" SET
  "first_name" = split_part("name", ' ', 1),
  "last_name" = CASE
    WHEN position(' ' IN "name") > 0
    THEN substring("name" FROM position(' ' IN "name") + 1)
    ELSE ''
  END;

-- 5. Make firstName/lastName NOT NULL after backfill
ALTER TABLE "users"
  ALTER COLUMN "first_name" SET NOT NULL,
  ALTER COLUMN "last_name" SET NOT NULL;

-- 6. Partial indexes for soft-delete queries
CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
CREATE INDEX "users_delete_scheduled_for_idx" ON "users" ("delete_scheduled_for") WHERE "delete_scheduled_for" IS NOT NULL;
CREATE INDEX "organizations_deleted_at_idx" ON "organizations" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
CREATE INDEX "organizations_delete_scheduled_for_idx" ON "organizations" ("delete_scheduled_for") WHERE "delete_scheduled_for" IS NOT NULL;
