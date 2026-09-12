import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { deleteFromR2 } from '@/lib/r2';

// POST /api/user/delete-account
// Soft-delete: scrub PII and archive the user's listings, but keep the row so
// messages/inquiries/listings from other users don't lose their foreign key.
// The Firebase Auth account is deleted for real, which is what actually blocks
// future logins.
//
// This app does government-ID-linked identity verification (Didit KYC) for an
// EU audience, so "deleted" also has to mean the KYC decision payload and any
// documents the user uploaded (lease, insurance, proof of address) are
// actually gone — not just hidden behind deleted_at, and not left in R2.
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

  const docs = await d1Query<{ r2_key: string }>(
    'SELECT r2_key FROM user_documents WHERE user_id = ?', [uid]
  );
  await Promise.all(docs.map(d =>
    deleteFromR2(d.r2_key).catch(err =>
      console.error('[delete-account] failed to delete R2 document', d.r2_key, err)
    )
  ));
  await d1Query('DELETE FROM user_documents WHERE user_id = ?', [uid]);

  // email has a NOT NULL constraint (it's how Firebase auth records link back
  // to the row) — replace with a per-user placeholder on the reserved
  // .invalid TLD instead of leaving the real address in place.
  await d1Query(
    `UPDATE users
     SET deleted_at = ?, email = ?, name = NULL, phone = NULL, nationality = NULL,
         didit_session_id = NULL, didit_decision_json = NULL, decision_processed_at = NULL
     WHERE id = ?`,
    [Date.now(), `deleted-${uid}@unistay.invalid`, uid]
  );

  await d1Query(`UPDATE listings SET status = 'archived' WHERE landlord_id = ?`, [uid]);

  await adminAuth.deleteUser(uid);

  return NextResponse.json({ ok: true });
}
