-- Run this against the live D1 database before deploying the settings changes.
-- CREATE TABLE IF NOT EXISTS in schema.sql won't retroactively add columns to an
-- existing table, so this migration is separate.
--
--   wrangler d1 execute <db-name> --remote --file=scripts/migrate-user-settings.sql
--
-- or paste into the Cloudflare dashboard's D1 console.

ALTER TABLE users ADD COLUMN deleted_at INTEGER;
ALTER TABLE users ADD COLUMN preferences TEXT;
