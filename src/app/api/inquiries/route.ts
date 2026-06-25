import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

// POST /api/inquiries
// Called from the listing details page "Message host" form.
// Creates an inquiry (if one doesn't exist yet) and inserts the first message row.
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

  const { listing_id, message } = await req.json();
  if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });

  const now = Date.now();

  try {
    // Check if listing is in D1 to get landlord (static/partner listings won't be)
    const [listing] = await d1Query<{ landlord_id: string }>(
      'SELECT landlord_id FROM listings WHERE id = ?',
      [listing_id]
    );
    const landlordId = listing?.landlord_id ?? null;

    if (landlordId && landlordId === uid) {
      return NextResponse.json({ error: 'Cannot message your own listing' }, { status: 400 });
    }

    // Upsert inquiry — one per student+listing pair
    let inquiryId: string;
    const [existing] = await d1Query<{ id: string }>(
      'SELECT id FROM inquiries WHERE listing_id = ? AND student_id = ?',
      [listing_id, uid]
    );

    if (existing) {
      inquiryId = existing.id;
    } else {
      inquiryId = crypto.randomUUID();
      await d1Query(
        `INSERT INTO inquiries (id, listing_id, student_id, message, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
        [inquiryId, listing_id, uid, message.trim(), now, now]
      );
    }

    // Insert the message row
    const msgId = crypto.randomUUID();
    await d1Query(
      `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, created_at)
       VALUES (?, ?, ?, ?, 'text', ?)`,
      [msgId, inquiryId, uid, message.trim(), now]
    );

    await d1Query('UPDATE inquiries SET updated_at = ? WHERE id = ?', [now, inquiryId]);

    if (landlordId) {
      await d1Query(
        `INSERT INTO user_inbox_counts (user_id, unread) VALUES (?, 1)
         ON CONFLICT(user_id) DO UPDATE SET unread = unread + 1`,
        [landlordId]
      );
    }

    return NextResponse.json({ inquiry_id: inquiryId, message_id: msgId });
  } catch (err) {
    console.error('[POST /api/inquiries]', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
