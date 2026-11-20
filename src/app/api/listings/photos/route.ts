import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { uploadToR2 } from '@/lib/r2';
import { d1Query } from '@/lib/d1';
import { prepareImage } from '@/lib/prepareImage';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file       = formData.get('file') as File | null;
  const listingId  = formData.get('listingId') as string | null;

  if (!file || !listingId) {
    return NextResponse.json({ error: 'file and listingId required' }, { status: 400 });
  }

  // listingId becomes part of the R2 key — must be a plain UUID, never a path.
  if (!UUID_RE.test(listingId)) {
    return NextResponse.json({ error: 'invalid listingId' }, { status: 400 });
  }

  // Only an admin-approved landlord may upload listing photos — same gate as the
  // listing create/edit routes, so an unapproved user can't push objects to R2.
  const [applicant] = await d1Query<{ landlord_status: string }>(
    'SELECT landlord_status FROM users WHERE id = ?', [uid]
  );
  if (applicant?.landlord_status !== 'approved') {
    return NextResponse.json({ error: 'You need to be an approved landlord to upload photos.' }, { status: 403 });
  }

  // Same ownership rule as every other listing-mutating route. A brand-new
  // draft's id is a client-generated UUID with no row yet — that's fine,
  // only an existing listing owned by someone else is rejected.
  const [existing] = await d1Query<{ landlord_id: string }>(
    'SELECT landlord_id FROM listings WHERE id = ?', [listingId]
  );
  if (existing && existing.landlord_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const img = await prepareImage(file, 'POST /api/listings/photos');
  if ('error' in img) return NextResponse.json({ error: img.error }, { status: 400 });
  const { buffer, contentType, ext } = img;

  const r2Key = `listings/${listingId}/${crypto.randomUUID()}.${ext}`;

  try {
    await uploadToR2(r2Key, buffer, contentType);
  } catch (err) {
    console.error('[POST /api/listings/photos]', err);
    return NextResponse.json({ error: 'Upload to storage failed. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ r2Key });
}
