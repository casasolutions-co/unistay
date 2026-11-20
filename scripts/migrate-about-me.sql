-- "About me" profile, required before identity verification.
--
--   wrangler d1 execute <db-name> --remote --file=scripts/migrate-about-me.sql

ALTER TABLE users ADD COLUMN photo_key TEXT;   -- R2 key of the profile photo
ALTER TABLE users ADD COLUMN occupation TEXT;  -- student | professional | landlord
ALTER TABLE users ADD COLUMN traits TEXT;      -- JSON array of picked TRAITS (src/lib/aboutMe.ts)
ALTER TABLE users ADD COLUMN about TEXT;       -- free text, max 500 chars
