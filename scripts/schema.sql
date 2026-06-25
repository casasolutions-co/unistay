-- Full UniStay D1 schema. Safe to run on a fresh database.

CREATE TABLE IF NOT EXISTS users (
  id                   TEXT PRIMARY KEY,
  email                TEXT NOT NULL,
  name                 TEXT,
  phone                TEXT,
  nationality          TEXT,
  role                 TEXT NOT NULL DEFAULT 'student',
  university           TEXT,
  program              TEXT,
  start_year           TEXT,
  job_title            TEXT,
  why                  TEXT,
  profile_complete     INTEGER DEFAULT 0,
  verification_status  TEXT DEFAULT 'unverified',
  verification_note    TEXT,
  verified_at          INTEGER,
  verified_by          TEXT REFERENCES users(id),
  banned_at            INTEGER,
  banned_by            TEXT REFERENCES users(id),
  ban_reason           TEXT,
  ban_expires_at       INTEGER,
  created_at           INTEGER,
  updated_at           INTEGER
);

CREATE TABLE IF NOT EXISTS verification_docs (
  id               TEXT PRIMARY KEY,
  user_id          TEXT REFERENCES users(id),
  doc_type         TEXT,
  r2_key           TEXT,
  status           TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by      TEXT REFERENCES users(id),
  reviewed_at      INTEGER,
  created_at       INTEGER
);

CREATE TABLE IF NOT EXISTS listings (
  id             TEXT PRIMARY KEY,
  landlord_id    TEXT REFERENCES users(id),
  ptype          TEXT,
  title          TEXT,
  street         TEXT,
  city           TEXT,
  postcode       TEXT,
  bedrooms       INTEGER,
  bathrooms      INTEGER,
  size_sqm       INTEGER,
  floor          INTEGER,
  cold_rent      INTEGER,
  utilities      INTEGER,
  deposit        INTEGER,
  avail_from     TEXT,
  avail_to       TEXT,
  open_ended     INTEGER,
  min_period     INTEGER,
  max_period     INTEGER,
  description    TEXT,
  mate_count     INTEGER,
  mate_gender    TEXT,
  pref_gender    TEXT,
  mate_notes     TEXT,
  status         TEXT DEFAULT 'draft',
  rejection_reason TEXT,
  created_at     INTEGER,
  updated_at     INTEGER
);

CREATE TABLE IF NOT EXISTS listing_amenities (
  listing_id TEXT REFERENCES listings(id),
  amenity    TEXT,
  PRIMARY KEY (listing_id, amenity)
);

CREATE TABLE IF NOT EXISTS listing_photos (
  id         TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  r2_key     TEXT,
  position   INTEGER,
  is_cover   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inquiries (
  id         TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  student_id TEXT REFERENCES users(id),
  message    TEXT,
  status     TEXT DEFAULT 'pending',
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id),
  sender_id  TEXT NOT NULL REFERENCES users(id),
  body       TEXT NOT NULL,
  msg_type   TEXT NOT NULL DEFAULT 'text',
  metadata   TEXT,
  created_at INTEGER NOT NULL,
  read_at    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_messages_inquiry ON messages(inquiry_id, created_at);

CREATE TABLE IF NOT EXISTS user_inbox_counts (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  unread  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          TEXT PRIMARY KEY,
  admin_id    TEXT REFERENCES users(id),
  action      TEXT,
  target_type TEXT,
  target_id   TEXT,
  note        TEXT,
  created_at  INTEGER
);

CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY,
  reporter_id TEXT REFERENCES users(id),
  target_type TEXT,
  target_id   TEXT,
  reason      TEXT,
  status      TEXT DEFAULT 'open',
  resolved_by TEXT REFERENCES users(id),
  created_at  INTEGER
);
