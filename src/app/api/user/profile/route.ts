import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const [user] = await d1Query<{ preferences: string | null; [key: string]: unknown }>(
    `SELECT id, email, name, phone, nationality, role, university, program,
            start_year, job_title, why, profile_complete, verification_status, preferences
     FROM users WHERE id = ?`,
    [decoded.uid]
  );

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const defaultPreferences = { showActivityStatus: true, emailDigest: false, savedListingIds: [] as string[] };
  const preferences = user.preferences ? { ...defaultPreferences, ...JSON.parse(user.preferences) } : defaultPreferences;

  return NextResponse.json({ user: { ...user, preferences } });
}

export async function POST(req: NextRequest) {
  const { token, name, phone, nationality, role, university, program, startYear, jobTitle, why } = await req.json();

  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userRole = role === 'landlord' ? 'landlord' : 'student';

  await d1Query(
    `UPDATE users SET
      name = ?, phone = ?, nationality = ?, role = ?,
      university = ?, program = ?, start_year = ?,
      job_title = ?, why = ?, profile_complete = 1,
      updated_at = ?
     WHERE id = ?`,
    [name ?? null, phone ?? null, nationality ?? null, userRole,
     university ?? null, program ?? null, startYear ?? null,
     jobTitle ?? null, why ?? null, Date.now(), decoded.uid]
  );

  return NextResponse.json({ ok: true });
}
