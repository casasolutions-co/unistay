-- Adds a source discriminator to `listings` so admin-curated CASA listings
-- can live in the same table as PRIVATE (landlord-submitted) listings without
-- entering the moderation queue. CASA rows: landlord_id = NULL, status =
-- 'published', source = 'casa'. Existing rows default to 'private'.
ALTER TABLE listings ADD COLUMN source TEXT DEFAULT 'private';
