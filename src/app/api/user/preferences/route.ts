import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

// Every key any part of the app actually reads/writes on users.preferences —
// see profile/route.ts's defaultPreferences and messages/page.tsx's myPrefs.
const ALLOWED_KEYS = new Set([
  'showActivityStatus',
  'emailDigest',
  'savedListingIds',
  'mutedThreads',
  'blockedUsers',
  'hiddenThreads',
]);
const MAX_SERIALIZED_BYTES = 20_000;

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
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
    return NextResponse.json({ error: 'Invalid preferences payload' }, { status: 400 });
  }
  const unknownKeys = Object.keys(patch).filter(k => !ALLOWED_KEYS.has(k));
  if (unknownKeys.length > 0) {
    return NextResponse.json({ error: `Unknown preference key(s): ${unknownKeys.join(', ')}` }, { status: 400 });
  }

  const [row] = await d1Query<{ preferences: string | null }>(
    'SELECT preferences FROM users WHERE id = ?',
    [uid]
  );
  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const current = row.preferences ? JSON.parse(row.preferences) : {};
  const merged = { ...current, ...patch };
  const serialized = JSON.stringify(merged);
  if (serialized.length > MAX_SERIALIZED_BYTES) {
    return NextResponse.json({ error: 'Preferences payload too large' }, { status: 400 });
  }

  await d1Query(
    'UPDATE users SET preferences = ?, updated_at = ? WHERE id = ?',
    [serialized, Date.now(), uid]
  );

  return NextResponse.json({ preferences: merged });
}
