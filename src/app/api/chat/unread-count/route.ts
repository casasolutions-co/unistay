import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// GET /api/chat/unread-count
// Total unread messages across all of the user's threads (as student or landlord).
export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const [row] = await d1Query<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM messages m
     JOIN inquiries i ON i.id = m.inquiry_id
     LEFT JOIN listings l ON l.id = i.listing_id
     WHERE (i.student_id = ? OR l.landlord_id = ?)
       AND m.sender_id != ?
       AND m.read_at IS NULL`,
    [uid, uid, uid]
  );

  return NextResponse.json({ count: row?.count ?? 0 });
}
