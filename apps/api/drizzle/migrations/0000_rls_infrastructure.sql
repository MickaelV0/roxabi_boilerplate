-- RLS Infrastructure Migration
-- Issue: #21 - Multi-tenant Row-Level Security
--
-- This migration sets up the foundational RLS infrastructure:
-- 1. Creates the app_user role (used by the application connection)
-- 2. Creates a reusable function for applying RLS policies to tables
-- 3. Grants basic permissions to the app_user role

-- 1. Create application role (idempotent)
-- The app_user role is used by the application connection.
-- RLS policies apply to this role.
DO $$
BEGIN
  CREATE ROLE app_user;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- 2. Create the reusable RLS policy helper function
-- Usage: SELECT create_tenant_rls_policy('my_table_name');
CREATE OR REPLACE FUNCTION create_tenant_rls_policy(table_name text)
RETURNS void AS $$
BEGIN
  -- Enable RLS on the table
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

  -- Force RLS even for table owner (safety net)
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);

  -- Create the tenant isolation policy
  -- USING: controls which rows are visible (SELECT, UPDATE, DELETE)
  -- WITH CHECK: controls which rows can be inserted or updated
  EXECUTE format(
    'CREATE POLICY tenant_isolation_%I ON %I
      USING (tenant_id = current_setting(''app.tenant_id'', true))
      WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Grant permissions to app_user role
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
