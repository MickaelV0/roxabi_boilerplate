ALTER TABLE "organizations" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "delete_scheduled_for" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "full_name_customized" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_seed" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_style" text DEFAULT 'lorelei';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "delete_scheduled_for" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "organizations_deleted_at_idx" ON "organizations" USING btree ("deleted_at") WHERE "organizations"."deleted_at" is not null;--> statement-breakpoint
CREATE INDEX "organizations_delete_scheduled_for_idx" ON "organizations" USING btree ("delete_scheduled_for") WHERE "organizations"."delete_scheduled_for" is not null;--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at") WHERE "users"."deleted_at" is not null;--> statement-breakpoint
CREATE INDEX "users_delete_scheduled_for_idx" ON "users" USING btree ("delete_scheduled_for") WHERE "users"."delete_scheduled_for" is not null;