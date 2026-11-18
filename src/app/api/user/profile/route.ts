import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { DIDIT_OWNED_STATUSES, reconcileWithDidit } from '@/lib/didit';

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

  const [row] = await d1Query<{ preferences: string | null; verification_status: string; didit_session_id: string | null; decision_processed_at: number | null; [key: string]: unknown }>(
    `SELECT id, email, name, phone, nationality, residence_country, residence_city, role, university, program,
            start_year, job_title, why, profile_complete, verification_status, preferences, didit_session_id, decision_processed_at
     FROM users WHERE id = ?`,
    [decoded.uid]
  );

  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const { didit_session_id, decision_processed_at, ...user } = row;

  // Webhook may not have reached us; pull the outcome from Didit so every page shows the
  // real status. Skipped once a final outcome is stored (verified, admin-rejected/banned,
  // or declined/expired for the current session). ponytail: still one Didit call per load while a session is in
  // progress or in review — throttle if that volume ever matters.
  const syncable = DIDIT_OWNED_STATUSES.includes(user.verification_status)
    && !(user.verification_status === 'unverified' && decision_processed_at);
  if (syncable && didit_session_id) {
    const { status } = await reconcileWithDidit(decoded.uid, didit_session_id);
    if (status) user.verification_status = status;
  }

  const defaultPreferences = { showActivityStatus: true, emailDigest: false, savedListingIds: [] as string[] };
  const preferences = user.preferences ? { ...defaultPreferences, ...JSON.parse(user.preferences) } : defaultPreferences;

  return NextResponse.json({ user: { ...user, preferences } });
}

export async function POST(req: NextRequest) {
  const { token, name, phone, nationality, residenceCountry, residenceCity, role, university, program, startYear, jobTitle, why } = await req.json();

  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const userRole = role === 'landlord' ? 'landlord' : 'student';

  // Residence is only sent by the registration forms; the profile editor
  // doesn't send it, so COALESCE keeps what's stored instead of nulling it.

  await d1Query(
    `UPDATE users SET
      name = ?, phone = ?, nationality = ?,
      residence_country = COALESCE(?, residence_country), residence_city = COALESCE(?, residence_city), role = ?,
      university = ?, program = ?, start_year = ?,
      job_title = ?, why = ?, profile_complete = 1,
      updated_at = ?
     WHERE id = ?`,
    [name ?? null, phone ?? null, nationality ?? null, residenceCountry ?? null, residenceCity ?? null, userRole,
     university ?? null, program ?? null, startYear ?? null,
     jobTitle ?? null, why ?? null, Date.now(), decoded.uid]
  );

  return NextResponse.json({ ok: true });
}
