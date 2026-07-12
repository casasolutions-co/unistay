import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { deleteFromR2 } from '@/lib/r2';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// DELETE /api/user/documents/[id] — remove one of the signed-in user's uploaded documents.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { id } = await params;

  const [doc] = await d1Query<{ id: string; user_id: string; r2_key: string }>(
    'SELECT id, user_id, r2_key FROM user_documents WHERE id = ?',
    [id]
  );
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  if (doc.user_id !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await deleteFromR2(doc.r2_key);
  } catch (err) {
    console.error('[DELETE /api/user/documents/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete file. Please try again.' }, { status: 500 });
  }

  await d1Query('DELETE FROM user_documents WHERE id = ?', [id]);

  return NextResponse.json({ ok: true });
}
