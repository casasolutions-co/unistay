import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

// POST /api/support
// Called from the contact form. Creates a support ticket — an inquiry with no
// listing_id (type='support') — and inserts the first message row. Shows up
// in the same /messages inbox as regular listing inquiries.
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

  const { topic, subject, message } = await req.json();
  if (!subject?.trim()) return NextResponse.json({ error: 'subject required' }, { status: 400 });
  if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });

  const now = Date.now();
  const subjectLine = topic?.trim() ? `[${topic.trim()}] ${subject.trim()}` : subject.trim();

  try {
    const inquiryId = crypto.randomUUID();
    await d1Query(
      `INSERT INTO inquiries (id, listing_id, student_id, message, status, type, subject, created_at, updated_at)
       VALUES (?, NULL, ?, ?, 'pending', 'support', ?, ?, ?)`,
      [inquiryId, uid, message.trim(), subjectLine, now, now]
    );

    const msgId = crypto.randomUUID();
    await d1Query(
      `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, created_at)
       VALUES (?, ?, ?, ?, 'text', ?)`,
      [msgId, inquiryId, uid, message.trim(), now]
    );

    // No unread bump here — there's no admin participant yet. Once admin auth
    // exists, this is where a "notify any admin" step would go (see admin_support.md).

    return NextResponse.json({ inquiry_id: inquiryId, message_id: msgId });
  } catch (err) {
    console.error('[POST /api/support]', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
