-- One-time "CASA administrative fees" amount, entered in the admin panel when
-- creating a CASA listing and shown on the UniStay listing page (after Deposit,
-- included in "Due at move-in"). Private/partner listings leave it at 0.
--
-- Run with:
--   npx wrangler d1 execute <DATABASE_NAME_OR_ID> --remote --file=./migrations/002_add_listing_admin_fee.sql
ALTER TABLE listings ADD COLUMN admin_fee INTEGER DEFAULT 0;
