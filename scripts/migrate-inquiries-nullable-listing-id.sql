-- Makes inquiries.listing_id nullable so support tickets (type='support') can
-- be created with listing_id = NULL, as scripts/api/support/route.ts always does.
-- migrate-drop-listing-fk.sql removed the FK but kept the NOT NULL constraint,
-- which support tickets never accounted for. SQLite can't ALTER COLUMN, so we
-- recreate the table (same pattern as migrate-drop-listing-fk.sql).

CREATE TABLE inquiries_tmp (
  id         TEXT PRIMARY KEY,
  listing_id TEXT,
  student_id TEXT,
  message    TEXT,
  status     TEXT DEFAULT 'pending',
  created_at INTEGER,
  updated_at INTEGER,
  type       TEXT NOT NULL DEFAULT 'booking',
  subject    TEXT
);
INSERT INTO inquiries_tmp SELECT * FROM inquiries;
DROP TABLE inquiries;
ALTER TABLE inquiries_tmp RENAME TO inquiries;
