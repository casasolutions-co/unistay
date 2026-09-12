import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

// GET: current landlord application status (for the /list page's gate UI).
// POST: apply — requires the user to already be identity-verified (Didit
// KYC, `verification_status`). Idempotent: re-applying while pending/approved
// just returns the current status; a prior rejection can re-apply.
async function authedUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const uid = await authedUser(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await d1Query<{ landlord_status: string; landlord_note: string | null; verification_status: string }>(
    'SELECT landlord_status, landlord_note, verification_status FROM users WHERE id = ?', [uid]
  );
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    landlordStatus: user.landlord_status,
    landlordNote: user.landlord_note,
    verified: user.verification_status === 'verified',
  });
}

export async function POST(req: NextRequest) {
  const uid = await authedUser(req);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await d1Query<{ landlord_status: string; verification_status: string }>(
    'SELECT landlord_status, verification_status FROM users WHERE id = ?', [uid]
  );
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (user.verification_status !== 'verified') {
    return NextResponse.json(
      { error: 'Verify your identity first, then apply to become a landlord.', landlordStatus: user.landlord_status },
      { status: 403 }
    );
  }

  if (user.landlord_status === 'pending' || user.landlord_status === 'approved') {
    return NextResponse.json({ landlordStatus: user.landlord_status });
  }

  await d1Query(
    `UPDATE users SET landlord_status = 'pending', landlord_applied_at = ?, landlord_note = NULL WHERE id = ?`,
    [Date.now(), uid]
  );
  return NextResponse.json({ landlordStatus: 'pending' });
}
