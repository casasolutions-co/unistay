import { NextRequest, NextResponse } from 'next/server';
import heicConvert from 'heic-convert';
import { adminAuth } from '@/lib/firebase-admin';
import { uploadToR2 } from '@/lib/r2';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const HEIC_TYPES = ['image/heic', 'image/heif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per photo

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await adminAuth.verifyIdToken(token);
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
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP and HEIC images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Photo must be under 10 MB' }, { status: 400 });
  }

  let ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  let contentType = file.type;
  let buffer = Buffer.from(await file.arrayBuffer());

  // Browsers can't render HEIC/HEIF natively — convert to JPEG so uploaded
  // photos actually display once stored, instead of ever hitting R2 as HEIC.
  if (HEIC_TYPES.includes(file.type)) {
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
