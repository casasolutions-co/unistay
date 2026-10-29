-- One-off: remove E2E test users, their listings (plus any listing with "e2e"
-- in the title) and everything attached; then add residence_country.
-- The D1 dashboard console only runs the first statement, so run the file:
--   npx wrangler d1 execute <db-name> --remote --file=scripts/cleanup-e2e.sql
PRAGMA defer_foreign_keys = true;

UPDATE users SET landlord_reviewed_by = NULL WHERE landlord_reviewed_by IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com');
UPDATE verification_docs SET reviewed_by = NULL WHERE reviewed_by IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com');
UPDATE app_settings SET updated_by = NULL WHERE updated_by IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com');
UPDATE messages SET deleted_by = NULL WHERE deleted_by IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com');

DELETE FROM messages WHERE sender_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com')
  OR inquiry_id IN (SELECT id FROM inquiries WHERE student_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com')
     OR listing_id IN (SELECT id FROM listings WHERE title LIKE '%e2e%' OR landlord_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com')));
DELETE FROM inquiries WHERE student_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com')
  OR listing_id IN (SELECT id FROM listings WHERE title LIKE '%e2e%' OR landlord_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com'));
DELETE FROM reports WHERE reporter_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com')
  OR resolved_by IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com')
  OR target_id IN (SELECT id FROM listings WHERE title LIKE '%e2e%' OR landlord_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com'));

DELETE FROM listing_amenities WHERE listing_id IN (SELECT id FROM listings WHERE title LIKE '%e2e%' OR landlord_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com'));
DELETE FROM listing_photos WHERE listing_id IN (SELECT id FROM listings WHERE title LIKE '%e2e%' OR landlord_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com'));
DELETE FROM listings WHERE title LIKE '%e2e%' OR landlord_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com');

DELETE FROM user_documents WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com');
DELETE FROM verification_docs WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com');
DELETE FROM user_inbox_counts WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e.%example.com');
DELETE FROM users WHERE email LIKE 'e2e.%example.com';

ALTER TABLE users ADD COLUMN residence_country TEXT;
