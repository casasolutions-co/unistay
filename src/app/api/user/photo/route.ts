import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { uploadToR2, deleteFromR2, getSignedUrl } from '@/lib/r2';
import { prepareImage } from '@/lib/prepareImage';

// POST /api/user/photo — multipart `photo`. The profile photo is uploaded on its own
// from the profile card; everything else is saved by POST /api/user/profile.
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

  let photo: FormDataEntryValue | null;
  try {
    photo = (await req.formData()).get('photo');
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  if (!(photo instanceof File) || photo.size === 0) return NextResponse.json({ error: 'No photo sent' }, { status: 400 });

  const [row] = await d1Query<{ photo_key: string | null }>('SELECT photo_key FROM users WHERE id = ?', [uid]);
  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const img = await prepareImage(photo, 'POST /api/user/photo');
  if ('error' in img) return NextResponse.json({ error: img.error }, { status: 400 });
  const photoKey = `avatars/${uid}/${crypto.randomUUID()}.${img.ext}`;
  try {
    await uploadToR2(photoKey, img.buffer, img.contentType);
  } catch (err) {
    console.error('[POST /api/user/photo]', err);
    return NextResponse.json({ error: 'Photo upload failed. Please try again.' }, { status: 500 });
  }

  await d1Query('UPDATE users SET photo_key = ?, updated_at = ? WHERE id = ?', [photoKey, Date.now(), uid]);

  // Old photo is only dropped once the new one is saved; a failed delete just leaves an orphan.
  if (row.photo_key) deleteFromR2(row.photo_key).catch(err => console.error('[POST /api/user/photo] old photo delete', err));

  return NextResponse.json({ ok: true, photo_url: getSignedUrl(photoKey) });
}
