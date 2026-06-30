-- Add geocoordinate columns to listings table
ALTER TABLE listings ADD COLUMN lat REAL DEFAULT 0;
ALTER TABLE listings ADD COLUMN lng REAL DEFAULT 0;

-- Add separate room size column (apartment size stays in size_sqm)
ALTER TABLE listings ADD COLUMN room_size_sqm INTEGER DEFAULT 0;
