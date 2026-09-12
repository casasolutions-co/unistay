import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
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
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { listing_id, move_in, move_out } = await req.json();
  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });

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

    // Upsert inquiry — one per student+listing pair, shared with the messaging flow
    let inquiryId: string;
    const [existing] = await d1Query<{ id: string }>(
      'SELECT id FROM inquiries WHERE listing_id = ? AND student_id = ?',
      [listing_id, uid]
    );

    const summary = `Requested to book — move-in ${move_in ?? 'flexible'}`;

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

    const metadata = JSON.stringify({
      price: price ?? null,
      move_in: move_in ?? null,
      move_out: move_out ?? null,
      deposit: deposit ?? null,
      status: 'pending',
    });

    const msgId = crypto.randomUUID();
    await d1Query(
      `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, metadata, created_at)
       VALUES (?, ?, ?, ?, 'booking', ?, ?)`,
      [msgId, inquiryId, uid, summary, metadata, now]
    );

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
