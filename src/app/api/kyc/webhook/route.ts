import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { d1Query } from '@/lib/d1';
import { applyVerificationStatus, toVerificationStatus } from '@/lib/didit';

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const entries = keys.map(
      (k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`
    );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

// Didit's verification order (docs.didit.me/reference/webhooks): X-Signature-V2 over
// canonical JSON, then X-Signature over the raw body, then the deprecated
// X-Signature-Simple envelope. Each may also arrive as "<name>-previous" for 24h after a
// secret rotation. Returns the method that matched, or null.
function verifySignature(req: NextRequest, raw: string, body: Record<string, unknown>, secret: string) {
  const ts = req.headers.get('x-timestamp') ?? '';
  if (!/^\d+$/.test(ts) || Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > 300) return null;

  const hmac = (data: string) => crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
  const matches = (expected: string, header: string) =>
    [req.headers.get(header), req.headers.get(`${header}-previous`)].some(sig => {
      if (!sig) return false;
      const a = Buffer.from(expected, 'utf8');
      const b = Buffer.from(sig, 'utf8');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });

  if (matches(hmac(canonicalJson(body)), 'x-signature-v2')) return 'v2';
  if (matches(hmac(raw), 'x-signature')) return 'raw';
  const simple = [ts, body.session_id ?? '', body.status ?? '', body.webhook_type ?? ''].join(':');
  if (matches(hmac(simple), 'x-signature-simple')) return 'simple';
  return null;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const method = verifySignature(req, raw, payload, process.env.DIDIT_WEBHOOK_SECRET ?? '');
  if (!method) {
    // Loud on purpose: a wrong DIDIT_WEBHOOK_SECRET silently stops every verification
    // from reaching the DB (the scheduled sync-kyc function is the safety net).
    console.error('[didit webhook] signature rejected', {
      session_id: payload?.session_id, status: payload?.status,
      hasTimestamp: !!req.headers.get('x-timestamp'), secretSet: !!process.env.DIDIT_WEBHOOK_SECRET,
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  console.log('[didit webhook]', JSON.stringify({ method, session_id: payload.session_id, status: payload.status, webhook_type: payload.webhook_type }));

  const { session_id, webhook_type, status: diditStatus, decision, vendor_data } = payload as {
    session_id: string;
    webhook_type: string;
    status?: string;
    decision?: Record<string, unknown>;
    vendor_data?: string;
  };

  // Ignore webhooks for sessions that have been superseded by a newer one.
  const [user] = await d1Query<{ id: string; didit_session_id: string | null }>(
    'SELECT id, didit_session_id FROM users WHERE id = ?',
    [vendor_data ?? '']
  );
  if (!user || user.didit_session_id !== session_id) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const status = toVerificationStatus(diditStatus);
  if (status === null) {
    return NextResponse.json({ ok: true, webhook_type, ignored: true });
  }

  await applyVerificationStatus(user.id, status, decision);

  return NextResponse.json({ ok: true, webhook_type });
}
