#!/bin/bash
# Creates the roxabi_app application user for RLS enforcement.
#
# This script runs automatically on first Docker Postgres init
# (mounted to /docker-entrypoint-initdb.d/).
#
# The roxabi_app user:
# - Has LOGIN but NOT BYPASSRLS, so RLS policies are enforced
# - Is granted the app_user role (created by migration 0000_rls_infrastructure)
# - Is used by the NestJS application for all runtime queries
#
# The roxabi (superuser) remains the schema owner for migrations only.

set -euo pipefail

APP_USER="${POSTGRES_APP_USER:-roxabi_app}"
APP_PASSWORD="${POSTGRES_APP_PASSWORD:-roxabi_app}"
DB_NAME="${POSTGRES_DB:-roxabi}"

echo "Creating application user '$APP_USER'..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB_NAME" <<-EOSQL
  -- Create the application login user (idempotent)
  DO \$\$
  BEGIN
    CREATE ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}' NOBYPASSRLS;
  EXCEPTION
    WHEN duplicate_object THEN
      ALTER ROLE ${APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}' NOBYPASSRLS;
  END
  \$\$;

  -- Grant connect on the database
  GRANT CONNECT ON DATABASE ${DB_NAME} TO ${APP_USER};

  -- Grant schema usage
  GRANT USAGE ON SCHEMA public TO ${APP_USER};

  -- Grant DML on all existing tables
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_USER};

  -- Grant sequence usage (for serial/identity columns)
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_USER};

  -- Ensure future tables and sequences also get permissions
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${APP_USER};

  -- Grant drizzle schema access (for migration status checks)
  -- The schema may not exist yet on first boot, so we create it if needed
  CREATE SCHEMA IF NOT EXISTS drizzle;
  GRANT USAGE ON SCHEMA drizzle TO ${APP_USER};
  GRANT SELECT ON ALL TABLES IN SCHEMA drizzle TO ${APP_USER};
  ALTER DEFAULT PRIVILEGES IN SCHEMA drizzle GRANT SELECT ON TABLES TO ${APP_USER};
EOSQL

echo "Application user '$APP_USER' created successfully."
