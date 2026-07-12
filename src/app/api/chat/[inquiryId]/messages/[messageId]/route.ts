import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { bearerToken, verifyParticipant, bumpInquiryAndNotify } from '@/lib/chat';
import { sendEmail } from '@/lib/email';
import { bookingStatusEmail } from '@/lib/emails/templates';

const RESPONDABLE_TYPES = ['booking', 'viewing', 'viewing_times'];

// PATCH /api/chat/[inquiryId]/messages/[messageId]
// Recipient of a booking/viewing card responds accept/decline, or — for a
// `viewing_times` proposal — picks one of the proposed slots.
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
  if (message.sender_id === uid) {
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
  } else {
    const { status } = payload;
    if (status !== 'accepted' && status !== 'declined') {
      return NextResponse.json({ error: 'status must be accepted or declined' }, { status: 400 });
    }
    updatedMetadata = JSON.stringify({ ...meta, status });
    const label = message.msg_type === 'booking' ? 'Booking request' : 'Viewing request';
    confirmationBody = `${label} ${status === 'accepted' ? 'accepted ✓' : 'declined'}`;
  }

  await d1Query('UPDATE messages SET metadata = ? WHERE id = ?', [updatedMetadata, messageId]);

  const confirmationId = crypto.randomUUID();
  await d1Query(
    `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, created_at)
     VALUES (?, ?, ?, ?, 'text', ?)`,
    [confirmationId, inquiryId, uid, confirmationBody, now]
  );

  await bumpInquiryAndNotify(inquiryId, message.sender_id, now);

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
