-- Admin panel readiness: fixes the 3 blockers identified in ADMIN_PANEL_PLAN.md §12
-- Safe to run on a live DB — all additive (CREATE TABLE IF NOT EXISTS / ADD COLUMN), no drops/renames.

-- 1. Site-wide config / kill switches (plan §9)
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_by  TEXT REFERENCES users(id),
  updated_at  INTEGER
);

-- 2. Report resolution detail (plan §4)
ALTER TABLE reports ADD COLUMN resolved_at INTEGER;
ALTER TABLE reports ADD COLUMN resolution_note TEXT;

-- 3. Message redaction (plan §6)
ALTER TABLE messages ADD COLUMN deleted_at INTEGER;
ALTER TABLE messages ADD COLUMN deleted_by TEXT REFERENCES users(id);
