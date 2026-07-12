-- Run this against the live D1 database before deploying the support-ticket changes.
-- CREATE TABLE IF NOT EXISTS in schema.sql won't retroactively add columns to an
-- existing table, so this migration is separate.
--
--   wrangler d1 execute <db-name> --remote --file=scripts/migrate-support-tickets.sql
--
-- or paste into the Cloudflare dashboard's D1 console.
--
-- inquiries.listing_id was already nullable, so no ALTER is needed there —
-- a support ticket is simply an inquiry with listing_id = NULL and type = 'support'.

ALTER TABLE inquiries ADD COLUMN type TEXT NOT NULL DEFAULT 'booking';
ALTER TABLE inquiries ADD COLUMN subject TEXT;
