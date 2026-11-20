import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';
import { prepareImage } from '@/lib/prepareImage';
import { aboutMeMissing, parseTraits } from '@/lib/aboutMe';

// Saves the "about me" profile (photo, occupation, traits, about text) as multipart form
// data. `photo` is optional when one is already stored.
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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const photo = form.get('photo');
  const occupation = String(form.get('occupation') ?? '');
  const traits = parseTraits(String(form.get('traits') ?? '[]'));
  const about = String(form.get('about') ?? '').trim();

  const [row] = await d1Query<{ photo_key: string | null }>('SELECT photo_key FROM users WHERE id = ?', [uid]);
  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const hasNewPhoto = photo instanceof File && photo.size > 0;
  const missing = aboutMeMissing({ hasPhoto: hasNewPhoto || !!row.photo_key, occupation, traits, about });
  if (missing.length) return NextResponse.json({ error: `Still needed: ${missing.join(', ')}` }, { status: 400 });

  let photoKey = row.photo_key;
  if (hasNewPhoto) {
    const img = await prepareImage(photo, 'POST /api/user/about');
    if ('error' in img) return NextResponse.json({ error: img.error }, { status: 400 });
    photoKey = `avatars/${uid}/${crypto.randomUUID()}.${img.ext}`;
    try {
      await uploadToR2(photoKey, img.buffer, img.contentType);
    } catch (err) {
      console.error('[POST /api/user/about]', err);
      return NextResponse.json({ error: 'Photo upload failed. Please try again.' }, { status: 500 });
    }
  }

  await d1Query(
    'UPDATE users SET photo_key = ?, occupation = ?, traits = ?, about = ?, updated_at = ? WHERE id = ?',
    [photoKey, occupation, JSON.stringify(traits), about, Date.now(), uid]
  );

  // Old photo is only dropped once the new one is saved; a failed delete just leaves an orphan.
  if (hasNewPhoto && row.photo_key) deleteFromR2(row.photo_key).catch(err => console.error('[POST /api/user/about] old photo delete', err));

  return NextResponse.json({ ok: true });
}
