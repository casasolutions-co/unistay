import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// POST /api/reports — file a report against a user (or other target).
export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { targetType, targetId, reason } = await req.json();
  if (!targetType || !targetId || !reason) {
    return NextResponse.json({ error: 'targetType, targetId and reason are required' }, { status: 400 });
  }

  // Constrain what can be reported and cap the free-text so the moderation queue
  // can't be flooded with junk or oversized rows.
  const ALLOWED_TARGETS: Record<string, string | null> = {
    user: 'users', inquiry: 'inquiries', message: 'messages',
    listing: null, // may be a partner/casa id that isn't a D1 row — no existence check
  };
  if (!(targetType in ALLOWED_TARGETS)) {
    return NextResponse.json({ error: 'invalid targetType' }, { status: 400 });
  }
  if (typeof reason !== 'string' || reason.length > 2000) {
    return NextResponse.json({ error: 'reason must be under 2000 characters' }, { status: 400 });
  }

  // Target must actually exist (for D1-backed types), so moderators don't get
  // reports pointing at nothing.
  const table = ALLOWED_TARGETS[targetType];
  if (table) {
    const [exists] = await d1Query<{ id: string }>(`SELECT id FROM ${table} WHERE id = ?`, [targetId]);
    if (!exists) return NextResponse.json({ error: 'target not found' }, { status: 404 });
  }

  // De-dupe: one open report per reporter+target. Stops a spammer from filing
  // the same complaint in a loop (cheap abuse control without a rate-limit store).
  const [dupe] = await d1Query<{ id: string }>(
    `SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = 'open'`,
    [uid, targetType, targetId]
  );
  if (dupe) return NextResponse.json({ id: dupe.id, deduped: true });

  const id = crypto.randomUUID();
  await d1Query(
    `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`,
    [id, uid, targetType, targetId, reason, Date.now()]
  );

  return NextResponse.json({ id });
}
