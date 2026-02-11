-- Tech Debt Remediation: timestamps, indexes, unique constraint
-- Issue: #95 - Tech debt tracker from project audit
--
-- Changes:
-- 1. Alter timestamp columns to use timestamptz (withTimezone: true)
-- 2. Add updatedAt column to organizations and members tables
-- 3. Add indexes on FK columns for query performance
-- 4. Add unique constraint on invitations(organization_id, email)

-- 1. Convert existing timestamp columns to timestamptz
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;

ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "sessions" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;

ALTER TABLE "accounts" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "accounts" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;

ALTER TABLE "verifications" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;

ALTER TABLE "organizations" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;

ALTER TABLE "members" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;

-- 2. Add updatedAt to organizations and members (previously missing)
ALTER TABLE "organizations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "members" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

-- 3. Add indexes on FK columns (PostgreSQL does NOT auto-index FKs)
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");
CREATE INDEX "members_user_id_idx" ON "members" USING btree ("user_id");
CREATE INDEX "members_organization_id_idx" ON "members" USING btree ("organization_id");
CREATE INDEX "invitations_organization_id_idx" ON "invitations" USING btree ("organization_id");
CREATE INDEX "invitations_inviter_id_idx" ON "invitations" USING btree ("inviter_id");

-- 4. Unique constraint to prevent duplicate invitations
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_org_email_unique" UNIQUE ("organization_id", "email");
