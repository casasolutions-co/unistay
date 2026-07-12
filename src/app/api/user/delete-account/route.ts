import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

// POST /api/user/delete-account
// Soft-delete: scrub PII and archive the user's listings, but keep the row so
// messages/inquiries/listings from other users don't lose their foreign key.
// The Firebase Auth account is deleted for real, which is what actually blocks
// future logins.
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

  await d1Query(
    `UPDATE users SET deleted_at = ?, name = NULL, phone = NULL, nationality = NULL WHERE id = ?`,
    [Date.now(), uid]
  );

  await d1Query(`UPDATE listings SET status = 'archived' WHERE landlord_id = ?`, [uid]);

  await adminAuth.deleteUser(uid);

  return NextResponse.json({ ok: true });
}
