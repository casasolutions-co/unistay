-- Removes the FK constraint on inquiries.listing_id.
-- Static/partner listings live outside D1, so the FK would always fail for them.
-- SQLite can't DROP CONSTRAINT so we recreate both tables in dependency order.

-- 1. Move messages out of the way
CREATE TABLE messages_tmp (
  id         TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,
  sender_id  TEXT NOT NULL,
  body       TEXT NOT NULL,
  msg_type   TEXT NOT NULL DEFAULT 'text',
  metadata   TEXT,
  created_at INTEGER NOT NULL,
  read_at    INTEGER
);
INSERT OR IGNORE INTO messages_tmp SELECT * FROM messages;
DROP TABLE messages;
ALTER TABLE messages_tmp RENAME TO messages;
CREATE INDEX IF NOT EXISTS idx_messages_inquiry ON messages(inquiry_id, created_at);

-- 2. Recreate inquiries without FK on listing_id
CREATE TABLE inquiries_tmp (
  id         TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  student_id TEXT,
  message    TEXT,
  status     TEXT DEFAULT 'pending',
  created_at INTEGER,
  updated_at INTEGER
);
INSERT OR IGNORE INTO inquiries_tmp SELECT * FROM inquiries;
DROP TABLE inquiries;
ALTER TABLE inquiries_tmp RENAME TO inquiries;
