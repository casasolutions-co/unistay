-- Where the user currently lives, asked at registration (country + city).
-- Additive only — safe on the live DB. Paste into the D1 console or:
--
--   wrangler d1 execute <db-name> --remote --file=scripts/migrate-residence.sql

ALTER TABLE users ADD COLUMN residence_country TEXT;
ALTER TABLE users ADD COLUMN residence_city TEXT;
