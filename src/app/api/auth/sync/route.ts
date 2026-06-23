import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

export async function POST(req: NextRequest) {
  const { token, role } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  // Verify Firebase JWT
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const now = Date.now();
  const userRole = role === 'landlord' ? 'landlord' : 'student';

  // Upsert user into D1 — safe to call on every login
  // Role is only set on INSERT, never overwritten on login
  await d1Query(
    `INSERT INTO users (id, email, role, verification_status, created_at, updated_at)
     VALUES (?, ?, ?, 'unverified', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       updated_at = excluded.updated_at`,
    [decoded.uid, decoded.email ?? '', userRole, now, now]
  );

  // Return the user record
  const [user] = await d1Query(
    'SELECT id, email, role, verification_status FROM users WHERE id = ?',
    [decoded.uid]
  );

  return NextResponse.json({ user });
}
