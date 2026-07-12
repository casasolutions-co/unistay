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

  const id = crypto.randomUUID();
  await d1Query(
    `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`,
    [id, uid, targetType, targetId, reason, Date.now()]
  );

  return NextResponse.json({ id });
}
