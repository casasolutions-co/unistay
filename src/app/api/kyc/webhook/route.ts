import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { d1Query } from '@/lib/d1';

function shortenFloats(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shortenFloats);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, shortenFloats(v)])
    );
  }
  if (typeof value === 'number' && !Number.isInteger(value) && value % 1 === 0) {
    return Math.trunc(value);
  }
  return value;
}

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

function verifySignatureV2(body: unknown, signatureHeader: string, timestampHeader: string, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestampHeader, 10)) > 300) return false;

  const canonical = canonicalJson(shortenFloats(body));
  const expected = crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signatureHeader, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get('x-signature-v2');
  const timestamp = req.headers.get('x-timestamp');

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const valid = verifySignatureV2(payload, signature, timestamp, process.env.DIDIT_WEBHOOK_SECRET!);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // For now: just log so we can inspect real payload shape end-to-end.
  console.log('[didit webhook]', JSON.stringify(payload, null, 2));

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

  // Only 'In Review' is a genuine pending state (Didit's manual review). Every other
  // non-terminal status (Not Started, In Progress, Awaiting User, Resubmitted, ...) is just
  // progress chatter we don't need to reflect — leave verification_status untouched for those.
  const CANNOT_COMPLETE = new Set(['Declined', 'Abandoned', 'Expired', 'Kyc Expired']);

  let status: string | null = null;
  if (diditStatus === 'Approved') status = 'verified';
  else if (diditStatus === 'In Review') status = 'pending';
  else if (diditStatus && CANNOT_COMPLETE.has(diditStatus)) status = 'unverified';

  if (status === null) {
    return NextResponse.json({ ok: true, webhook_type, ignored: true });
  }

  await d1Query(
    `UPDATE users SET verification_status = ?, didit_decision_json = ?, decision_processed_at = ?, updated_at = ? WHERE id = ?`,
    [status, JSON.stringify(decision ?? {}), Date.now(), Date.now(), user.id]
  );

  return NextResponse.json({ ok: true, webhook_type });
}
