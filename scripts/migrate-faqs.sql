-- Run this against the live D1 database to add FAQ support.
-- CREATE TABLE IF NOT EXISTS is idempotent/additive, so this is safe to run
-- even if the table already exists — unlike the ALTER-based migrations in
-- this directory, a brand-new table doesn't need special retroactive handling.
--
--   wrangler d1 execute <db-name> --remote --file=scripts/migrate-faqs.sql
--
-- or paste into the Cloudflare dashboard's D1 console.

CREATE TABLE IF NOT EXISTS faqs (
  id         TEXT PRIMARY KEY,
  category   TEXT NOT NULL,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  published  INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category, position);

-- Seed with the FAQs that were previously hardcoded in
-- src/app/help/HelpCenterMobile.tsx, so the cutover to the dynamic /api/faqs
-- endpoint doesn't lose any content. INSERT OR IGNORE keys off `id`, so this
-- is safe to re-run.
INSERT OR IGNORE INTO faqs (id, category, question, answer, position, published, created_at, updated_at) VALUES
  ('booking-1', 'booking', 'How do I book a room on UniStay?', 'Open a listing, check availability, and tap "Request to book." The landlord confirms within their response window, and you''ll get a notification once it''s accepted.', 1, 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('booking-2', 'booking', 'Can I cancel a confirmed booking?', 'Yes. Go to Settings → Applications, open the booking, and tap Cancel. Refund eligibility depends on the landlord''s cancellation policy shown at checkout.', 2, 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('payments-1', 'payments', 'What payment methods are supported?', 'We support major debit/credit cards and SEPA bank transfer for landlords based in the EU. Payment details are securely processed by our payment partner.', 1, 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('payments-2', 'payments', 'When is my deposit charged?', 'Deposits are only charged once a landlord accepts your booking request, never before. You''ll see a clear breakdown of charges before you confirm.', 2, 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('account-1', 'account', 'How do I verify my identity?', 'Go to Settings → Verify identity and upload a valid photo ID. Verification usually completes within a few minutes.', 1, 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('account-2', 'account', 'How do I change my email or password?', 'Open Settings → Profile to update your email, or use the "Forgot password" link on the login screen to reset your password.', 2, 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('safety-1', 'safety', 'How are listings verified?', 'Every listing goes through document and ownership checks before it goes live, and we monitor for suspicious activity across the platform.', 1, 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000),
  ('safety-2', 'safety', 'What should I do if something feels wrong?', 'Use the Report button on a listing or profile, or contact support directly — our safety team reviews every report within 24 hours.', 2, 1, strftime('%s','now') * 1000, strftime('%s','now') * 1000);
