import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { DIDIT_OWNED_STATUSES, reconcileWithDidit, type DiditDecision } from '@/lib/didit';

// Terminal statuses where Didit considers the session over — a fresh one is required.
// Expired: TTL elapsed before the user opened the link.
// Abandoned: user started but didn't finish within the allowed timeframe.
const EXPIRED_STATUSES = new Set(['Expired', 'Kyc Expired', 'Abandoned']);

export async function POST(req: NextRequest) {
  const { token, next } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const [existing] = await d1Query<{ didit_session_id: string | null; verification_status: string }>(
    'SELECT didit_session_id, verification_status FROM users WHERE id = ?',
    [decoded.uid]
  );

  if (existing?.verification_status === 'verified') {
    return NextResponse.json({ status: 'verified' });
  }
  // Rejected/banned by an admin: a new Didit result wouldn't be applied anyway, so don't
  // send them through Didit for nothing.
  if (existing && !DIDIT_OWNED_STATUSES.includes(existing.verification_status)) {
    return NextResponse.json({ error: 'Your verification was reviewed by our team. Please contact support.' }, { status: 403 });
  }

  if (existing?.didit_session_id) {
    // The previous session may already be decided even if our webhook never landed —
    // record that instead of sending the user back into a finished Didit session.
    const { decision, status } = await reconcileWithDidit(decoded.uid, existing.didit_session_id);
    if (status === 'verified' || status === 'pending') {
      return NextResponse.json({ status });
    }
    const resumed = resumableSession(decision);
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
      // Send the user back to the host they started on (not the NEXT_PUBLIC_APP_URL
      // fallback, which pointed localhost/preview users at unistay.com) and to the page
      // they came from. `next` must be a same-origin path to avoid an open redirect.
      callback: callbackUrl(req.nextUrl.origin, next),
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
    `UPDATE users SET didit_session_id = ?, decision_processed_at = NULL, updated_at = ? WHERE id = ?`,
    [session.session_id, Date.now(), decoded.uid]
  );

  return NextResponse.json({ url: session.url, session_id: session.session_id });
}

function callbackUrl(origin: string, next: unknown): string {
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    const url = new URL(next, origin);
    if (url.origin === origin && url.pathname !== '/verify') return url.href;
  }
  return `${origin}/verify?kyc=callback`;
}

// Returns the hosted URL of an existing Didit session if it is still usable. Null means
// the caller should create a brand-new session (not found, expired, or lookup failed).
function resumableSession(data: DiditDecision | null): { session_url: string } | null {
  if (!data?.session_url || !data.status) return null;
  if (EXPIRED_STATUSES.has(data.status)) return null;
  if (data.expires_at && Date.now() > new Date(data.expires_at).getTime()) return null;
  return { session_url: data.session_url };
}
