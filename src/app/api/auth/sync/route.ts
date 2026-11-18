import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { getAppSetting } from '@/lib/settings';
import { sendEmail } from '@/lib/email';
import { welcomeEmail } from '@/lib/emails/templates';
import { normalizeRole, saveProfile, type ProfileInput } from '@/lib/userProfile';

export async function POST(req: NextRequest) {
  // `profile` is sent by the email sign-up form so account + profile land in one request.
  const { token, role, profile } = await req.json() as { token?: string; role?: string; profile?: ProfileInput };

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
  const userRole = normalizeRole(role);

  // Only gate brand-new accounts — an existing user logging back in must
  // never be locked out by this switch, it's a signups-only kill switch.
  const [existing] = await d1Query<{ id: string }>('SELECT id FROM users WHERE id = ?', [decoded.uid]);
  if (!existing && !(await getAppSetting('signups_enabled'))) {
    return NextResponse.json({ error: 'New sign-ups are temporarily disabled.' }, { status: 403 });
  }

  // Upsert user into D1 — safe to call on every login
  // Role is only set on INSERT, never overwritten on login
  await d1Query(
    `INSERT INTO users (id, email, name, role, verification_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'unverified', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       email = excluded.email,
       name = COALESCE(users.name, excluded.name),
       updated_at = excluded.updated_at`,
    [decoded.uid, decoded.email ?? '', decoded.name ?? null, userRole, now, now]
  );

  if (profile) await saveProfile(decoded.uid, { ...profile, role: userRole });

  if (!existing && decoded.email) {
    // The token can predate updateProfile(displayName), so prefer the name the form sent.
    const { subject, html } = welcomeEmail({ name: profile?.name || decoded.name, role: userRole });
    void sendEmail(decoded.email, subject, html);
  }

  // Return the user record including profile completeness
  const [user] = await d1Query(
    'SELECT id, email, role, verification_status, profile_complete FROM users WHERE id = ?',
    [decoded.uid]
  );

  return NextResponse.json({ user });
}
