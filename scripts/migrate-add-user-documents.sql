-- Adds general-purpose document uploads (lease, insurance, proof of address, etc.)
-- that a user shares from their account — separate from identity verification,
-- which runs entirely through Didit (users.verification_status).

CREATE TABLE IF NOT EXISTS user_documents (
  id           TEXT PRIMARY KEY,
  user_id      TEXT REFERENCES users(id),
  doc_type     TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  r2_key       TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user ON user_documents(user_id, created_at);
