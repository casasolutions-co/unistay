-- Landlord applications: one row per submission (re-applying after a
-- rejection adds a new row, so history is kept). users.landlord_status stays
-- the source of truth for the current decision; the admin's "Landlord
-- requests" screen reads the latest row here for the applicant's answers.
--
--   wrangler d1 execute <db-name> --remote --file=scripts/migrate-landlord-applications.sql

CREATE TABLE IF NOT EXISTS landlord_applications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT NOT NULL REFERENCES users(id),
  rental_type     TEXT NOT NULL CHECK (rental_type IN ('owner', 'sublet', 'agency')),
  listing_count   TEXT NOT NULL CHECK (listing_count IN ('1', '2-5', '6+')),
  phone           TEXT NOT NULL,
  company_name    TEXT,            -- agency only
  company_website TEXT,            -- agency only
  declarations    TEXT NOT NULL,   -- JSON array of DECLARATIONS keys (src/lib/landlordApplication.ts)
  terms_version   TEXT NOT NULL,   -- LANDLORD_TERMS_VERSION accepted
  submitted_at    INTEGER NOT NULL -- ms epoch; also the terms acceptance time
);

CREATE INDEX IF NOT EXISTS idx_landlord_applications_user
  ON landlord_applications (user_id, submitted_at DESC);
