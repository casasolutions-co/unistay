import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { bearerToken, verifyParticipant, bumpInquiryAndNotify, resolveRecipient } from '@/lib/chat';
import { sendEmail } from '@/lib/email';
import { bookingStatusEmail } from '@/lib/emails/templates';

const RESPONDABLE_TYPES = ['booking', 'viewing', 'viewing_times'];

// Booking moves: target status → statuses it may come from. The booking card
// is sent by the student, so the card's recipient is the landlord.
const LANDLORD_MOVES: Record<string, string[]> = {
  accepted: ['pending'],
  declined: ['pending'],
  cancelled: ['accepted'],          // release the room
};
const STUDENT_MOVES: Record<string, string[]> = {
  cancelled: ['pending', 'accepted'], // withdraw
};

// PATCH /api/chat/[inquiryId]/messages/[messageId]
// Recipient of a booking/viewing card responds accept/decline, or — for a
// `viewing_times` proposal — picks one of the proposed slots. The student who
// sent a booking card may withdraw it.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ inquiryId: string; messageId: string }> }
) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { inquiryId, messageId } = await params;

  if (!(await verifyParticipant(uid, inquiryId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = await req.json();

  const [message] = await d1Query<{
    id: string; inquiry_id: string; sender_id: string; msg_type: string; metadata: string | null;
  }>(
    `SELECT id, inquiry_id, sender_id, msg_type, metadata FROM messages WHERE id = ? AND inquiry_id = ?`,
    [messageId, inquiryId]
  );

  if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  const isSender = message.sender_id === uid;
  if (isSender && message.msg_type !== 'booking') {
    return NextResponse.json({ error: 'Only the recipient can respond' }, { status: 403 });
  }
  if (!RESPONDABLE_TYPES.includes(message.msg_type)) {
    return NextResponse.json({ error: 'Message is not respondable' }, { status: 400 });
  }

  const meta = message.metadata ? JSON.parse(message.metadata) : {};
  const now = Date.now();
  let updatedMetadata: string;
  let confirmationBody: string;

  if (message.msg_type === 'viewing_times') {
    const { selectedIndex } = payload;
    const slots: { date: string; time: string }[] = meta.slots ?? [];
    if (
      typeof selectedIndex !== 'number' ||
      selectedIndex < 0 ||
      selectedIndex >= slots.length
    ) {
      return NextResponse.json({ error: 'selectedIndex out of range' }, { status: 400 });
    }
    updatedMetadata = JSON.stringify({
      ...meta,
      status: 'selected',
      selectedIndex,
      selectedBy: uid,
      selectedAt: now,
    });
    const slot = slots[selectedIndex];
    confirmationBody = `Viewing time confirmed: ${slot.date} · ${slot.time}`;
  } else if (message.msg_type === 'booking') {
    const { status } = payload;
    const from = (isSender ? STUDENT_MOVES : LANDLORD_MOVES)[status];
    if (!from) {
      return NextResponse.json({ error: 'That action is not allowed on this booking.' }, { status: 400 });
    }
    // "Provider holds room?" — only meaningful on accept.
    const roomHeld = status === 'accepted' && payload.hold === true ? 1 : 0;
    let updated: { id: string }[];
    try {
      updated = await d1Query<{ id: string }>(
        `UPDATE bookings SET status = ?, room_held = ?, updated_at = ?
         WHERE id = ? AND status IN (${from.map(() => '?').join(',')}) RETURNING id`,
        [status, roomHeld, now, messageId, ...from]
      );
    } catch (err) {
      if (String(err).includes('UNIQUE')) {
        return NextResponse.json(
          { error: "You've already accepted another student for this room. Cancel that booking first." },
          { status: 409 }
        );
      }
      throw err;
    }
    if (!updated.length) {
      return NextResponse.json({ error: 'This booking has already changed. Refresh to see its status.' }, { status: 409 });
    }
    updatedMetadata = JSON.stringify({ ...meta, status, room_held: roomHeld });
    confirmationBody =
      status === 'accepted' ? `Booking request accepted ✓${roomHeld ? ' — room on hold' : ''}`
      : status === 'declined' ? 'Booking request declined'
      : isSender ? 'Booking request withdrawn'
      : 'Booking cancelled by the host — the room is available again';
  } else {
    const { status } = payload;
    if (status !== 'accepted' && status !== 'declined') {
      return NextResponse.json({ error: 'status must be accepted or declined' }, { status: 400 });
    }
    updatedMetadata = JSON.stringify({ ...meta, status });
    confirmationBody = `Viewing request ${status === 'accepted' ? 'accepted ✓' : 'declined'}`;
  }

  await d1Query('UPDATE messages SET metadata = ? WHERE id = ?', [updatedMetadata, messageId]);

  const confirmationId = crypto.randomUUID();
  await d1Query(
    `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, created_at)
     VALUES (?, ?, ?, ?, 'text', ?)`,
    [confirmationId, inquiryId, uid, confirmationBody, now]
  );

  const other = await resolveRecipient(uid, inquiryId);
  await bumpInquiryAndNotify(inquiryId, other?.recipientId ?? null, now);

  if (message.msg_type === 'booking' && (payload.status === 'accepted' || payload.status === 'declined')) {
    const [recipient] = await d1Query<{ email: string; name: string | null }>(
      'SELECT email, name FROM users WHERE id = ?',
      [message.sender_id]
    );
    const [row] = await d1Query<{ title: string | null }>(
      `SELECT l.title FROM inquiries i LEFT JOIN listings l ON l.id = i.listing_id WHERE i.id = ?`,
      [inquiryId]
    );
    if (recipient?.email) {
      const { subject, html } = bookingStatusEmail({
        studentName: recipient.name,
        listingTitle: row?.title ?? 'the listing',
        status: payload.status,
      });
      void sendEmail(recipient.email, subject, html);
    }
  }

  return NextResponse.json({
    metadata: updatedMetadata,
    confirmation: { id: confirmationId, created_at: now, body: confirmationBody },
  });
}
