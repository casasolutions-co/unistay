-- Fixes: admin_audit_log.admin_id has a FOREIGN KEY against users(id), but the
-- column actually stores the admin's email (see _writeAudit in src/lib/data.ts)
-- and admins aren't rows in `users` anyway (that table is students/landlords
-- only) — so every audit-log insert has been silently failing the FK check
-- and getting swallowed. There's no admins table to repoint the FK to, so the
-- fix is just dropping the constraint.
--
-- SQLite (D1) can't ALTER TABLE ... DROP CONSTRAINT, so this recreates the
-- table without the FK and copies the existing rows across.
--
-- Run with:
--   npx wrangler d1 execute <DATABASE_NAME_OR_ID> --remote --file=./migrations/001_drop_audit_log_admin_fk.sql
-- (npx wrangler login first if not already authenticated; `npx wrangler d1 list`
-- shows your database names if you don't have it handy.)

CREATE TABLE admin_audit_log_new (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  note TEXT,
  created_at INTEGER
);

INSERT INTO admin_audit_log_new (id, admin_id, action, target_type, target_id, note, created_at)
SELECT id, admin_id, action, target_type, target_id, note, created_at FROM admin_audit_log;

DROP TABLE admin_audit_log;

ALTER TABLE admin_audit_log_new RENAME TO admin_audit_log;
