import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

// Terminal statuses where Didit considers the session over — a fresh one is required.
// Expired: TTL elapsed before the user opened the link.
// Abandoned: user started but didn't finish within the allowed timeframe.
const EXPIRED_STATUSES = new Set(['Expired', 'Kyc Expired', 'Abandoned']);

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const [existing] = await d1Query<{ didit_session_id: string | null }>(
    'SELECT didit_session_id FROM users WHERE id = ?',
    [decoded.uid]
  );

  if (existing?.didit_session_id) {
    const resumed = await tryResumeSession(existing.didit_session_id);
    if (resumed) {
      return NextResponse.json({ url: resumed.session_url, session_id: existing.didit_session_id, resumed: true });
    }
  }

  const res = await fetch('https://verification.didit.me/v3/session/', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.DIDIT_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      callback: `https://app.casasolutions.co/verify?kyc=callback`,
      vendor_data: decoded.uid,
      contact_details: { email: decoded.email },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[kyc/create-session] Didit rejected the request', { status: res.status, body: text });
    return NextResponse.json({ error: 'Didit session creation failed', details: text }, { status: 502 });
  }

  const session = await res.json() as { session_id: string; url: string };

  // Don't set verification_status here — the user hasn't done anything yet. Only the
  // webhook (on an actual Didit outcome) should move status off 'unverified'.
  await d1Query(
    `UPDATE users SET didit_session_id = ?, updated_at = ? WHERE id = ?`,
    [session.session_id, Date.now(), decoded.uid]
  );

  return NextResponse.json({ url: session.url, session_id: session.session_id });
}

// Checks whether an existing Didit session is still usable and, if so, returns its
// hosted URL to redirect the user back into it. Returns null when the caller should
// fall through to creating a brand-new session (not found, expired, or lookup failed).
async function tryResumeSession(sessionId: string): Promise<{ session_url: string } | null> {
  let res: Response;
  try {
    res = await fetch(`https://verification.didit.me/v3/session/${sessionId}/decision/`, {
      headers: { 'x-api-key': process.env.DIDIT_API_KEY! },
    });
  } catch (err) {
    console.error('[kyc/create-session] Didit session lookup failed, creating new session', err);
    return null;
  }

  if (!res.ok) {
    // 404 (unknown/deleted session) or any other error -> fall through to a new session.
    return null;
  }

  const data = await res.json() as { status?: string; session_url?: string; expires_at?: string };

  if (!data.session_url || !data.status) return null;
  if (EXPIRED_STATUSES.has(data.status)) return null;
  if (data.expires_at && Date.now() > new Date(data.expires_at).getTime()) return null;

  return { session_url: data.session_url };
}
