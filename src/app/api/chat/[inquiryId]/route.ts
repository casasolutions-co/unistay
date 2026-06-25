import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

async function verifyParticipant(uid: string, inquiryId: string): Promise<boolean> {
  const rows = await d1Query(
    `SELECT i.id FROM inquiries i
     LEFT JOIN listings l ON l.id = i.listing_id
     WHERE i.id = ? AND (i.student_id = ? OR l.landlord_id = ?)`,
    [inquiryId, uid, uid]
  );
  return rows.length > 0;
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

  let messages;
  if (since) {
    messages = await d1Query<{
      id: string; sender_id: string; body: string;
      msg_type: string; metadata: string | null; created_at: number; read_at: number | null;
    }>(
      `SELECT id, sender_id, body, msg_type, metadata, created_at, read_at
       FROM messages
       WHERE inquiry_id = ? AND created_at > ?
       ORDER BY created_at ASC`,
      [inquiryId, parseInt(since, 10)]
    );
  } else {
    // Initial load — last 50, oldest first
    messages = await d1Query<{
      id: string; sender_id: string; body: string;
      msg_type: string; metadata: string | null; created_at: number; read_at: number | null;
    }>(
      `SELECT id, sender_id, body, msg_type, metadata, created_at, read_at
       FROM (
         SELECT * FROM messages WHERE inquiry_id = ?
         ORDER BY created_at DESC LIMIT 50
       ) ORDER BY created_at ASC`,
      [inquiryId]
    );
  }

  return NextResponse.json({ messages, uid });
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

  const id = crypto.randomUUID();
  const now = Date.now();

  await d1Query(
    `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, inquiryId, uid, body.trim(), msg_type, metadata ? JSON.stringify(metadata) : null, now]
  );

  // Keep inquiry sorted by latest activity
  await d1Query(
    `UPDATE inquiries SET updated_at = ? WHERE id = ?`,
    [now, inquiryId]
  );

  // Increment unread for the other participant
  const [inquiry] = await d1Query<{ student_id: string; landlord_id: string }>(
    `SELECT i.student_id, l.landlord_id
     FROM inquiries i JOIN listings l ON l.id = i.listing_id
     WHERE i.id = ?`,
    [inquiryId]
  );
  if (inquiry) {
    const recipientId = inquiry.student_id === uid ? inquiry.landlord_id : inquiry.student_id;
    await d1Query(
      `INSERT INTO user_inbox_counts (user_id, unread) VALUES (?, 1)
       ON CONFLICT(user_id) DO UPDATE SET unread = unread + 1`,
      [recipientId]
    );
  }

  return NextResponse.json({ id, created_at: now });
}
