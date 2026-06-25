import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// POST /api/chat/[inquiryId]/read
// Marks all unread incoming messages as read and decrements the inbox counter.
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
  const now = Date.now();

  // Count how many we're about to mark read so we can decrement accurately
  const [{ cnt }] = await d1Query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM messages
     WHERE inquiry_id = ? AND sender_id != ? AND read_at IS NULL`,
    [inquiryId, uid]
  );

  if (cnt > 0) {
    await d1Query(
      `UPDATE messages SET read_at = ?
       WHERE inquiry_id = ? AND sender_id != ? AND read_at IS NULL`,
      [now, inquiryId, uid]
    );

    await d1Query(
      `UPDATE user_inbox_counts
       SET unread = MAX(0, unread - ?)
       WHERE user_id = ?`,
      [cnt, uid]
    );
  }

  return NextResponse.json({ ok: true, marked: cnt });
}
