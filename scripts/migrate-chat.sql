-- Run this only if your DB already has the base schema (users, listings, inquiries).
-- If starting fresh, run schema.sql instead — it includes these tables.

-- Core messages table
CREATE TABLE IF NOT EXISTS messages (
  id          TEXT    PRIMARY KEY,
  inquiry_id  TEXT    NOT NULL REFERENCES inquiries(id),
  sender_id   TEXT    NOT NULL REFERENCES users(id),
  body        TEXT    NOT NULL,
  msg_type    TEXT    NOT NULL DEFAULT 'text',   -- 'text' | 'file' | 'booking' | 'viewing'
  metadata    TEXT,                               -- JSON blob for structured card types
  created_at  INTEGER NOT NULL,
  read_at     INTEGER                             -- NULL = unread
);

CREATE INDEX IF NOT EXISTS idx_messages_inquiry ON messages(inquiry_id, created_at);

-- Denormalised unread counter — avoids COUNT(*) on every inbox load
CREATE TABLE IF NOT EXISTS user_inbox_counts (
  user_id  TEXT PRIMARY KEY REFERENCES users(id),
  unread   INTEGER DEFAULT 0
);
