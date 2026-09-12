import { NextRequest, NextResponse } from 'next/server';
import heicConvert from 'heic-convert';
import { adminAuth } from '@/lib/firebase-admin';
import { uploadToR2 } from '@/lib/r2';
import { d1Query } from '@/lib/d1';
import { sniffMime } from '@/lib/sniff-mime';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const HEIC_TYPES = ['image/heic', 'image/heif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per photo

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

  // Same ownership rule as every other listing-mutating route. A brand-new
  // draft's id is a client-generated UUID with no row yet — that's fine,
  // only an existing listing owned by someone else is rejected.
  const [existing] = await d1Query<{ landlord_id: string }>(
    'SELECT landlord_id FROM listings WHERE id = ?', [listingId]
  );
  if (existing && existing.landlord_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP and HEIC images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Photo must be under 10 MB' }, { status: 400 });
  }

  let ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  let buffer = Buffer.from(await file.arrayBuffer());

  // The declared file.type is whatever the browser/client claims — sniff the
  // actual bytes so a renamed/relabeled file can't sneak past the allow-list.
  const sniffed = sniffMime(buffer, file.type);
  if (!sniffed || !ALLOWED_TYPES.includes(sniffed)) {
    return NextResponse.json({ error: 'File content does not match its declared type' }, { status: 400 });
  }
  let contentType = sniffed;

  // Browsers can't render HEIC/HEIF natively — convert to JPEG so uploaded
  // photos actually display once stored, instead of ever hitting R2 as HEIC.
  if (HEIC_TYPES.includes(contentType)) {
    try {
      const jpegBuffer = await heicConvert({ buffer, format: 'JPEG', quality: 0.9 });
      buffer = Buffer.from(jpegBuffer);
      contentType = 'image/jpeg';
      ext = 'jpg';
    } catch (err) {
      console.error('[POST /api/listings/photos] HEIC conversion failed:', err);
      return NextResponse.json({ error: 'Could not process this HEIC photo. Try converting it to JPEG first.' }, { status: 400 });
    }
  }

  const r2Key = `listings/${listingId}/${crypto.randomUUID()}.${ext}`;

  try {
    await uploadToR2(r2Key, buffer, contentType);
  } catch (err) {
    console.error('[POST /api/listings/photos]', err);
    return NextResponse.json({ error: 'Upload to storage failed. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ r2Key });
}
