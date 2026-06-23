import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

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
