-- The city search in src/app/api/listings/route.ts and
-- src/lib/listings/partner.ts filters on a normalised expression
-- (LOWER(REPLACE(...city...))), not the raw `city` column, so the existing
-- plain idx_partner_listings_city index (and the missing one on `listings`)
-- can't be used — every search does a full table scan.
--
-- COLLATE NOCASE is required on the index, not just correctness sugar: SQLite
-- only turns `x LIKE 'prefix%'` into an index range scan when the indexed
-- expression's collation matches LIKE's default case-insensitivity. A BINARY
-- (default) expression index is silently ignored and it falls back to a full
-- scan — verified locally with EXPLAIN QUERY PLAN before writing this. The
-- LOWER() already normalises case at query time, so NOCASE here changes
-- nothing about which rows match, only lets the planner trust that it can.
CREATE INDEX IF NOT EXISTS idx_partner_listings_city_norm
  ON partner_listings(LOWER(REPLACE(city, ' ', '-')) COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_listings_city_norm
  ON listings(LOWER(REPLACE(REPLACE(REPLACE(REPLACE(city,'ü','u'),'ä','a'),'ö','o'),'ß','ss')) COLLATE NOCASE);
