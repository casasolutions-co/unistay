-- "Search this area" filters partner listings by map bounds. Their coordinates
-- only lived inside raw_json, so a bounds query would json_extract every row
-- (~13k) — break them out into indexed columns instead. Run once before
-- deploying the code that reads them; partner-sync.ts writes them from now on.
ALTER TABLE partner_listings ADD COLUMN lat REAL;
ALTER TABLE partner_listings ADD COLUMN lng REAL;
UPDATE partner_listings SET
  lat = CAST(json_extract(raw_json, '$.location.coordinates.latitude') AS REAL),
  lng = CAST(json_extract(raw_json, '$.location.coordinates.longitude') AS REAL);
CREATE INDEX IF NOT EXISTS idx_partner_listings_latlng ON partner_listings(lat, lng);
CREATE INDEX IF NOT EXISTS idx_listings_latlng ON listings(lat, lng);
