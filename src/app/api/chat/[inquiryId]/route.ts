import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { getSignedUrl } from '@/lib/r2';
import { bearerToken, verifyParticipant, resolveRecipient, isBlockedPair, bumpInquiryAndNotify } from '@/lib/chat';

type RawMessage = {
  id: string; sender_id: string; body: string;
  msg_type: string; metadata: string | null; created_at: number; read_at: number | null;
};

// Adds a signed download URL for `file` messages so the client never needs to know
// about R2 keys directly.
function withSignedUrls(messages: RawMessage[]) {
  return messages.map(m => {
    if (m.msg_type !== 'file' || !m.metadata) return m;
    const meta = JSON.parse(m.metadata);
    if (!meta.r2Key) return m;
    return { ...m, metadata: JSON.stringify({ ...meta, url: getSignedUrl(meta.r2Key, 3600) }) };
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

  return NextResponse.json({ messages: withSignedUrls(messages), uid });
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
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { inquiryId } = await params;

  if (!(await verifyParticipant(uid, inquiryId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { body, msg_type = 'text', metadata = null } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

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
