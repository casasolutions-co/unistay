import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { DIDIT_OWNED_STATUSES, reconcileWithDidit } from '@/lib/didit';
import { saveProfile, markEmailVerified } from '@/lib/userProfile';
import { getSignedUrl } from '@/lib/r2';
import { parseTraits } from '@/lib/aboutMe';
import { HOUSING_TYPES } from '@/lib/profileOptions';

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
            start_year, job_title, why, profile_complete, verification_status, preferences, didit_session_id, decision_processed_at,
            photo_key, occupation, traits, about, management_type, properties_count, property_cities, email_verified
     FROM users WHERE id = ?`,
    [decoded.uid]
  );

  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const { didit_session_id, decision_processed_at, photo_key, traits, ...user } = row as typeof row & { photo_key: string | null; traits: string | null };

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

  // Firebase owns email verification; mirror it so the admin panel sees it.
  if (decoded.email_verified && !user.email_verified) {
    await markEmailVerified(decoded.uid);
    user.email_verified = 1;
  }

  const defaultPreferences = { showActivityStatus: true, emailDigest: false, savedListingIds: [] as string[] };
  const preferences = user.preferences ? { ...defaultPreferences, ...JSON.parse(user.preferences) } : defaultPreferences;

  const photo_url = photo_key ? getSignedUrl(photo_key) : null;
  return NextResponse.json({ user: { ...user, preferences, photo_url, traits: parseTraits(traits) } });
}

export async function POST(req: NextRequest) {
  const { token, ...profile } = await req.json();

  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  await saveProfile(decoded.uid, profile);

  // Housing preferences (tenants) live in users.preferences.housing, same shape
  // /register/preferences writes; merged so the other preference keys survive.
  const housing = cleanHousing(profile.housing);
  if (housing) {
    const [row] = await d1Query<{ preferences: string | null }>('SELECT preferences FROM users WHERE id = ?', [decoded.uid]);
    const current = row?.preferences ? JSON.parse(row.preferences) : {};
    await d1Query('UPDATE users SET preferences = ? WHERE id = ?', [JSON.stringify({ ...current, housing }), decoded.uid]);
  }

  return NextResponse.json({ ok: true });
}

function cleanHousing(h: unknown) {
  if (!h || typeof h !== 'object') return null;
  const v = h as Record<string, unknown>;
  const price = (x: unknown) => {
    const n = Number(x);
    return x !== '' && x != null && Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.round(n) : null;
  };
  return {
    city: typeof v.city === 'string' ? v.city.trim().slice(0, 100) : '',
    types: Array.isArray(v.types) ? v.types.filter(t => HOUSING_TYPES.includes(t)) : [],
    minPrice: price(v.minPrice),
    maxPrice: price(v.maxPrice),
    moveIn: typeof v.moveIn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.moveIn) ? v.moveIn : '',
  };
}
