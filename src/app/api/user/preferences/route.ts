import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

// PATCH /api/user/preferences
// Merges { showActivityStatus?, emailDigest?, savedListingIds?, ... } into the user's stored preferences JSON.
export async function PATCH(req: NextRequest) {
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

  const patch = await req.json();

  const [row] = await d1Query<{ preferences: string | null }>(
    'SELECT preferences FROM users WHERE id = ?',
    [uid]
  );
  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const current = row.preferences ? JSON.parse(row.preferences) : {};
  const merged = { ...current, ...patch };

  await d1Query(
    'UPDATE users SET preferences = ?, updated_at = ? WHERE id = ?',
    [JSON.stringify(merged), Date.now(), uid]
  );

  return NextResponse.json({ preferences: merged });
}
