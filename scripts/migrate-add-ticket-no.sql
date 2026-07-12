-- Adds a sequential, human-readable ticket number for support inquiries
-- (type='support'), so it can be shown consistently in /messages and in
-- the admin panel, instead of a UUID-derived display string.

ALTER TABLE inquiries ADD COLUMN ticket_no INTEGER;
