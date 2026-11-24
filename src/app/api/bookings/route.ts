import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { isBlockedPair } from '@/lib/chat';
import { stayError } from '@/lib/stayDates';
import { sendEmail } from '@/lib/email';
import { bookingRequestEmail } from '@/lib/emails/templates';

// POST /api/bookings
// Called from the listing details page "Request to book" CTA.
// Creates an inquiry (if one doesn't exist yet) and inserts a structured
// booking-request message that renders as a BookingCard in /messages.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token, true); // true: a ban (revoked tokens) applies immediately
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { listing_id, move_in, move_out } = await req.json();
  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  const datesError = stayError(move_in, move_out);
  if (datesError) return NextResponse.json({ error: datesError }, { status: 400 });

  const now = Date.now();

  try {
    // price/deposit are re-derived from the listing row, not trusted from the
    // request body — no payment processor sits behind this today, but this
    // card is what the landlord sees as "the deal", so it shouldn't be
    // client-editable.
    const [listing] = await d1Query<{ landlord_id: string; title: string; cold_rent: number; utilities: number; deposit: number }>(
      'SELECT landlord_id, title, cold_rent, utilities, deposit FROM listings WHERE id = ?',
      [listing_id]
    );
    const landlordId = listing?.landlord_id ?? null;
    const price = listing ? listing.cold_rent + listing.utilities : null;
    const deposit = listing ? listing.deposit : null;

    if (landlordId && landlordId === uid) {
      return NextResponse.json({ error: 'Cannot book your own listing' }, { status: 400 });
    }
    if (landlordId && (await isBlockedPair(uid, landlordId))) {
      return NextResponse.json({ error: 'You can no longer contact this host.' }, { status: 403 });
    }

    const [me] = await d1Query<{ verification_status: string | null }>(
      'SELECT verification_status FROM users WHERE id = ?',
      [uid]
    );
    if (me?.verification_status !== 'verified') {
      return NextResponse.json(
        { error: 'Verify your identity before requesting a booking.', code: 'unverified' },
        { status: 403 }
      );
    }

    // Friendly errors for the two cases the unique indexes also enforce.
    const open = await d1Query<{ student_id: string }>(
      `SELECT student_id FROM bookings
       WHERE listing_id = ? AND (
         (student_id = ? AND status IN ('pending', 'accepted'))
         OR (status = 'accepted' AND room_held = 1))`,
      [listing_id, uid]
    );
    if (open.some(b => b.student_id === uid)) {
      return NextResponse.json({ error: 'You already have an open booking request for this listing.' }, { status: 409 });
    }
    if (open.length) {
      return NextResponse.json({ error: 'This room is temporarily unavailable.' }, { status: 409 });
    }

    // Upsert inquiry — one per student+listing pair, shared with the messaging flow
    let inquiryId: string;
    const [existing] = await d1Query<{ id: string }>(
      'SELECT id FROM inquiries WHERE listing_id = ? AND student_id = ?',
      [listing_id, uid]
    );

    const summary = `Requested to book — ${move_in} to ${move_out}`;

    if (existing) {
      inquiryId = existing.id;
    } else {
      inquiryId = crypto.randomUUID();
      await d1Query(
        `INSERT INTO inquiries (id, listing_id, student_id, message, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
        [inquiryId, listing_id, uid, summary, now, now]
      );
    }

    // Card display snapshot; the live status comes from the bookings row.
    const metadata = JSON.stringify({
      price: price ?? null,
      move_in: move_in ?? null,
      move_out: move_out ?? null,
      deposit: deposit ?? null,
      status: 'pending',
    });

    // Booking row first: its unique indexes are the real guard against
    // double-clicks and races. Its id doubles as the card message's id.
    const msgId = crypto.randomUUID();
    try {
      await d1Query(
        `INSERT INTO bookings (id, inquiry_id, listing_id, student_id, move_in, move_out, price, deposit, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        [msgId, inquiryId, listing_id, uid, move_in, move_out, price, deposit, now, now]
      );
    } catch (err) {
      if (String(err).includes('UNIQUE')) {
        return NextResponse.json({ error: 'You already have an open booking request for this listing.' }, { status: 409 });
      }
      throw err;
    }
    try {
      await d1Query(
        `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, metadata, created_at)
         VALUES (?, ?, ?, ?, 'booking', ?, ?)`,
        [msgId, inquiryId, uid, summary, metadata, now]
      );
    } catch (err) {
      // No card means the landlord can't act on it, so don't leave it blocking a retry.
      await d1Query('DELETE FROM bookings WHERE id = ?', [msgId]).catch(() => {});
      throw err;
    }

    await d1Query('UPDATE inquiries SET updated_at = ? WHERE id = ?', [now, inquiryId]);

    if (landlordId) {
      await d1Query(
        `INSERT INTO user_inbox_counts (user_id, unread) VALUES (?, 1)
         ON CONFLICT(user_id) DO UPDATE SET unread = unread + 1`,
        [landlordId]
      );

      const [landlord] = await d1Query<{ email: string; name: string | null }>(
        'SELECT email, name FROM users WHERE id = ?',
        [landlordId]
      );
      const [student] = await d1Query<{ name: string | null }>(
        'SELECT name FROM users WHERE id = ?',
        [uid]
      );
      if (landlord?.email) {
        const { subject, html } = bookingRequestEmail({
          landlordName: landlord.name,
          studentName: student?.name,
          listingTitle: listing?.title ?? 'your listing',
          moveIn: move_in,
        });
        void sendEmail(landlord.email, subject, html);
      }
    }

    return NextResponse.json({ inquiry_id: inquiryId, message_id: msgId });
  } catch (err) {
    console.error('[POST /api/bookings]', err);
    return NextResponse.json({ error: 'Failed to send booking request. Please try again.' }, { status: 500 });
  }
}
