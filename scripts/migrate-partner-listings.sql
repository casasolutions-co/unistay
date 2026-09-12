-- Partner (HousingAnywhere) listings, synced every 6h by
-- netlify/functions/sync-partner-listings-background.ts. Replaces the old
-- public/partner-cities/*.json + scripts/split-partner-listings.mjs approach,
-- which required a full app redeploy to refresh and did per-request file
-- scans instead of indexed SQL. raw_json is the untouched feed item, still
-- consumed by mapListing()/mapPartnerDetail() — only the columns needed for
-- WHERE-clause filtering are broken out.
CREATE TABLE IF NOT EXISTS partner_listings (
  id             TEXT PRIMARY KEY,       -- 'partner-<remote_id>', matches UnifiedListing.id
  remote_id      TEXT NOT NULL UNIQUE,
  remote_updated TEXT NOT NULL,          -- HousingAnywhere's own `updated` field; our change-detection key
  city           TEXT NOT NULL,
  price          INTEGER NOT NULL,
  ptype          TEXT NOT NULL,
  avail_from     TEXT,
  rank           INTEGER NOT NULL DEFAULT 0,
  raw_json       TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_listings_city ON partner_listings(city);
