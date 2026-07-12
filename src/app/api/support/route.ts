import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { sendEmail } from '@/lib/email';
import { supportTicketCreatedEmail } from '@/lib/emails/templates';

// POST /api/support
// Called from the contact form. Creates a support ticket — an inquiry with no
// listing_id (type='support') — and inserts the first message row. Shows up
// in the same /messages inbox as regular listing inquiries.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email;
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
      `INSERT INTO inquiries (id, listing_id, student_id, message, status, type, subject, ticket_no, created_at, updated_at)
       VALUES (?, NULL, ?, ?, 'pending', 'support', ?,
         (SELECT COALESCE(MAX(ticket_no), 0) + 1 FROM inquiries WHERE type = 'support'),
         ?, ?)`,
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

    if (email) {
      const [row] = await d1Query<{ ticket_no: number; name: string | null }>(
        `SELECT i.ticket_no, u.name FROM inquiries i LEFT JOIN users u ON u.id = i.student_id WHERE i.id = ?`,
        [inquiryId]
      );
      if (row?.ticket_no != null) {
        const { subject: emailSubject, html } = supportTicketCreatedEmail({
          name: row.name,
          ticketNo: row.ticket_no,
          subject: subjectLine,
        });
        void sendEmail(email, emailSubject, html);
      }
    }

    return NextResponse.json({ inquiry_id: inquiryId, message_id: msgId });
  } catch (err) {
    console.error('[POST /api/support]', err);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }
}
