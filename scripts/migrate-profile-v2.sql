-- Profile page v2: email-verification mirror + occupation backfill.
-- Additive only — safe on the live DB. Paste into the D1 console or:
--
--   wrangler d1 execute <db-name> --remote --file=scripts/migrate-profile-v2.sql

-- Firebase owns email verification; this mirrors it so the admin panel can see it.
-- Synced from the ID token's email_verified claim on login and on every profile load.
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verified_at INTEGER;

-- occupation (student | professional | landlord) is now the user's type everywhere.
-- Signup used to drop "professional" (users.role only knows student/landlord), so
-- derive it for existing rows the same way the old About me form guessed it.
UPDATE users SET occupation = CASE
    WHEN role = 'landlord' THEN 'landlord'
    WHEN job_title IS NOT NULL AND TRIM(job_title) <> '' THEN 'professional'
    ELSE 'student'
  END
WHERE occupation IS NULL OR occupation = '';
