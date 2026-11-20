import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { parseLandlordApplication, LandlordApplication } from '@/lib/landlordApplication';

// GET: current landlord application status (for the /list page's gate UI).
// POST: apply with the answers from src/lib/landlordApplication.ts — requires
// the user to already be identity-verified (Didit KYC, `verification_status`).
// Each submission is saved as a row in `landlord_applications`. Idempotent:
// re-applying while pending/approved just returns the current status; a prior
// rejection can re-apply (adds a new row).
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

  const [row] = await d1Query<{
    rental_type: string; listing_count: string; phone: string;
    company_name: string | null; company_website: string | null; submitted_at: number;
  }>(
    `SELECT rental_type, listing_count, phone, company_name, company_website, submitted_at
       FROM landlord_applications WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1`, [uid]
  );

  return NextResponse.json({
    landlordStatus: user.landlord_status,
    landlordNote: user.landlord_note,
    verified: user.verification_status === 'verified',
    // Latest answers, so the pending screen can summarise them and a re-apply starts pre-filled.
    application: row ? {
      rentalType: row.rental_type,
      listingCount: row.listing_count,
      phone: row.phone,
      companyName: row.company_name,
      companyWebsite: row.company_website,
      submittedAt: row.submitted_at,
    } : null,
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

  const body = await req.json().catch(() => null);
  const parsed = parseLandlordApplication(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const a: LandlordApplication = parsed.value;

  const now = Date.now();
  // Application row first: if the status update then fails, the user simply
  // re-submits; the reverse order could leave a pending user with no answers.
  await d1Query(
    `INSERT INTO landlord_applications
       (user_id, rental_type, listing_count, phone, company_name, company_website, declarations, terms_version, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uid, a.rentalType, a.listingCount, a.phone, a.companyName, a.companyWebsite, JSON.stringify(a.declarations), a.termsVersion, now]
  );
  await d1Query(
    `UPDATE users SET landlord_status = 'pending', landlord_applied_at = ?, landlord_note = NULL WHERE id = ?`,
    [now, uid]
  );
  return NextResponse.json({ landlordStatus: 'pending' });
}
