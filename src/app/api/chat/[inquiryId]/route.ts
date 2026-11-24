import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { attachmentUrls } from '@/lib/r2';
import { bearerToken, verifyParticipant, resolveRecipient, isBlockedPair, bumpInquiryAndNotify } from '@/lib/chat';

type RawMessage = {
  id: string; sender_id: string; body: string;
  msg_type: string; metadata: string | null; created_at: number; read_at: number | null;
};

// Adds a signed download URL for `file` messages so the client never needs to know
// about R2 keys directly.
function withSignedUrls(messages: RawMessage[], inquiryId: string) {
  return messages.map(m => {
    if (m.msg_type !== 'file' || !m.metadata) return m;
    const meta = JSON.parse(m.metadata);
    if (typeof meta.r2Key !== 'string' || !meta.r2Key.startsWith(`chat/${inquiryId}/`)) return m;
    return { ...m, metadata: JSON.stringify({ ...meta, ...attachmentUrls(meta.r2Key, meta.name ?? m.body) }) };
  });
}

// GET /api/chat/[inquiryId]?since=<unix_ms>
// Without since: returns last 50 messages (for initial load)
// With since: returns all messages after that timestamp (for polling)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inquiryId: string }> }
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

  const { inquiryId } = await params;

  if (!(await verifyParticipant(uid, inquiryId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const since = req.nextUrl.searchParams.get('since');

  let messages: RawMessage[];
  if (since) {
    messages = await d1Query<RawMessage>(
      `SELECT id, sender_id, body, msg_type, metadata, created_at, read_at
       FROM messages
       WHERE inquiry_id = ? AND created_at > ?
       ORDER BY created_at ASC`,
      [inquiryId, parseInt(since, 10)]
    );
  } else {
    // Initial load — last 50, oldest first
    messages = await d1Query<RawMessage>(
      `SELECT id, sender_id, body, msg_type, metadata, created_at, read_at
       FROM (
         SELECT * FROM messages WHERE inquiry_id = ?
         ORDER BY created_at DESC LIMIT 50
       ) ORDER BY created_at ASC`,
      [inquiryId]
    );
  }

  return NextResponse.json({ messages: withSignedUrls(await withBookingStatus(messages), inquiryId), uid });
}

// Booking cards show the live status from the bookings table, not the
// snapshot in metadata. A card with no row (duplicate skipped by the
// migration backfill) shows as cancelled.
async function withBookingStatus(messages: RawMessage[]) {
  const ids = messages.filter(m => m.msg_type === 'booking').map(m => m.id);
  if (!ids.length) return messages;
  const rows = await d1Query<{ id: string; status: string; room_held: number }>(
    `SELECT id, status, room_held FROM bookings WHERE id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  const byId = new Map(rows.map(r => [r.id, r]));
  return messages.map(m => m.msg_type !== 'booking' ? m : {
    ...m,
    metadata: JSON.stringify({
      ...(m.metadata ? JSON.parse(m.metadata) : {}),
      status: byId.get(m.id)?.status ?? 'cancelled',
      room_held: byId.get(m.id)?.room_held ?? 0,
    }),
  });
}

// POST /api/chat/[inquiryId]  — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inquiryId: string }> }
) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token, true); // true: a ban (revoked tokens) applies immediately
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { inquiryId } = await params;

  if (!(await verifyParticipant(uid, inquiryId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { body, msg_type = 'text', metadata: rawMeta = null } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  // Files and booking cards have their own routes. Letting the client post them
  // here would let it forge a card or point a 'file' message at any R2 key.
  if (msg_type !== 'text' && msg_type !== 'viewing_times') {
    return NextResponse.json({ error: 'Unsupported message type' }, { status: 400 });
  }
  let metadata: { slots: { date: string; time: string }[]; status: 'pending' } | null = null;
  if (msg_type === 'viewing_times') {
    const slots = Array.isArray(rawMeta?.slots) ? rawMeta.slots : [];
    if (!slots.length || slots.length > 10 || !slots.every((x: unknown) =>
      typeof (x as { date?: unknown })?.date === 'string' && typeof (x as { time?: unknown })?.time === 'string')) {
      return NextResponse.json({ error: 'Invalid viewing times' }, { status: 400 });
    }
    metadata = { slots: slots.map((x: { date: string; time: string }) => ({ date: x.date.slice(0, 40), time: x.time.slice(0, 40) })), status: 'pending' };
  }

  const inquiry = await resolveRecipient(uid, inquiryId);
  const recipientId = inquiry?.recipientId ?? null;

  if (inquiry && inquiry.type !== 'support' && recipientId && (await isBlockedPair(uid, recipientId))) {
    return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await d1Query(
    `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, inquiryId, uid, body.trim(), msg_type, metadata ? JSON.stringify(metadata) : null, now]
  );

  await bumpInquiryAndNotify(inquiryId, recipientId, now);

  return NextResponse.json({ id, created_at: now });
}
