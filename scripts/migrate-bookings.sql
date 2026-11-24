-- Booking requests get their own table instead of living in messages.metadata.
-- bookings.id = id of the chat message that renders the booking card.
--
--   wrangler d1 execute <db-name> --remote --file=scripts/migrate-bookings.sql

CREATE TABLE IF NOT EXISTS bookings (
  id          TEXT PRIMARY KEY,                       -- = messages.id of the booking card
  inquiry_id  TEXT NOT NULL REFERENCES inquiries(id), -- the chat thread
  listing_id  TEXT NOT NULL,                          -- no FK: static listings aren't in D1
  student_id  TEXT NOT NULL REFERENCES users(id),
  move_in     TEXT,
  move_out    TEXT,
  price       INTEGER,                                -- snapshot at request time
  deposit     INTEGER,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'confirmed', 'declined', 'cancelled')),
  room_held   INTEGER NOT NULL DEFAULT 0,  -- landlord chose "hold room" on accept
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- One open request per student per listing (no duplicate cards).
CREATE UNIQUE INDEX IF NOT EXISTS one_open_booking
  ON bookings(listing_id, student_id) WHERE status IN ('pending', 'accepted');

-- One accepted student per listing. accepted + room_held = room temporarily unavailable.
-- confirmed = listing marked Rented.
CREATE UNIQUE INDEX IF NOT EXISTS one_accepted_booking
  ON bookings(listing_id) WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_bookings_listing ON bookings(listing_id, status);

-- Backfill from existing booking cards. Duplicates that would break the unique
-- indexes are skipped (OR IGNORE); their cards then show as cancelled.
INSERT OR IGNORE INTO bookings (id, inquiry_id, listing_id, student_id, move_in, move_out, price, deposit, status, room_held, created_at, updated_at)
SELECT m.id, m.inquiry_id, i.listing_id, i.student_id,
       json_extract(m.metadata, '$.move_in'), json_extract(m.metadata, '$.move_out'),
       json_extract(m.metadata, '$.price'), json_extract(m.metadata, '$.deposit'),
       COALESCE(json_extract(m.metadata, '$.status'), 'pending'),
       COALESCE(json_extract(m.metadata, '$.status') = 'accepted', 0),  -- old accepts held the room
       m.created_at, m.created_at
FROM messages m JOIN inquiries i ON i.id = m.inquiry_id
WHERE m.msg_type = 'booking' AND i.listing_id IS NOT NULL
ORDER BY m.created_at ASC;
