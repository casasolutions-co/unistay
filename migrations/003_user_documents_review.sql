-- The UniStay app saves user uploads to user_documents, but the admin
-- Documents page used to read verification_docs (which nothing writes any
-- more), so uploads never reached admin review. These columns let admins
-- approve/reject user_documents directly. Existing uploads start as 'pending'.
--
-- Run once (Cloudflare D1 console, or):
--   npx wrangler d1 execute <DATABASE_NAME_OR_ID> --remote --file=./migrations/003_user_documents_review.sql
ALTER TABLE user_documents ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE user_documents ADD COLUMN rejection_reason TEXT;
ALTER TABLE user_documents ADD COLUMN reviewed_at INTEGER;
