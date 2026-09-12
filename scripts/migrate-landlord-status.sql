-- Landlord approval gate. Being a verified user (verification_status, the
-- existing Didit KYC check) and being an approved landlord are separate
-- things: any verified user can apply, but only an approved landlord may
-- publish a listing (enforced in POST /api/listings). Admin reviews
-- applications in the "Landlord requests" screen.
ALTER TABLE users ADD COLUMN landlord_status TEXT NOT NULL DEFAULT 'none'; -- none | pending | approved | rejected
ALTER TABLE users ADD COLUMN landlord_note TEXT;
ALTER TABLE users ADD COLUMN landlord_applied_at INTEGER;
ALTER TABLE users ADD COLUMN landlord_reviewed_at INTEGER;
ALTER TABLE users ADD COLUMN landlord_reviewed_by TEXT REFERENCES users(id);
