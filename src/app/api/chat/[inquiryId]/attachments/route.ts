import { NextRequest, NextResponse } from 'next/server';
import heicConvert from 'heic-convert';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { uploadToR2 } from '@/lib/r2';
import { bearerToken, verifyParticipant, resolveRecipient, isBlockedPair, bumpInquiryAndNotify } from '@/lib/chat';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const HEIC_TYPES = ['image/heic', 'image/heif'];
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB

// POST /api/chat/[inquiryId]/attachments — upload a photo or document and post it as a message.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inquiryId: string }> }
) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { inquiryId } = await params;

  if (!(await verifyParticipant(uid, inquiryId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const inquiry = await resolveRecipient(uid, inquiryId);
  const recipientId = inquiry?.recipientId ?? null;

  if (inquiry && inquiry.type !== 'support' && recipientId && (await isBlockedPair(uid, recipientId))) {
    return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const kind = formData.get('kind') as string | null;

  if (!file || (kind !== 'photo' && kind !== 'document')) {
    return NextResponse.json({ error: 'file and kind (photo|document) are required' }, { status: 400 });
  }

  const allowedTypes = kind === 'photo' ? PHOTO_TYPES : DOCUMENT_TYPES;
  const maxBytes = kind === 'photo' ? MAX_PHOTO_BYTES : MAX_DOCUMENT_BYTES;

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: kind === 'photo' ? 'Only JPEG, PNG, WebP and HEIC images are allowed' : 'Only PDF and Word documents are allowed' },
      { status: 400 }
    );
  }
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `File must be under ${maxBytes / (1024 * 1024)} MB` }, { status: 400 });
  }

  let ext = file.name.split('.').pop()?.toLowerCase() ?? (kind === 'photo' ? 'jpg' : 'pdf');
  let contentType = file.type;
  let buffer = Buffer.from(await file.arrayBuffer());

  if (kind === 'photo' && HEIC_TYPES.includes(file.type)) {
    try {
      const jpegBuffer = await heicConvert({ buffer, format: 'JPEG', quality: 0.9 });
      buffer = Buffer.from(jpegBuffer);
      contentType = 'image/jpeg';
      ext = 'jpg';
    } catch (err) {
      console.error('[POST /api/chat/[inquiryId]/attachments] HEIC conversion failed:', err);
      return NextResponse.json({ error: 'Could not process this HEIC photo. Try converting it to JPEG first.' }, { status: 400 });
    }
  }

  const r2Key = `chat/${inquiryId}/${crypto.randomUUID()}.${ext}`;

  try {
    await uploadToR2(r2Key, buffer, contentType);
  } catch (err) {
    console.error('[POST /api/chat/[inquiryId]/attachments]', err);
    return NextResponse.json({ error: 'Upload to storage failed. Please try again.' }, { status: 500 });
  }

  const messageId = crypto.randomUUID();
  const now = Date.now();
  const metadata = {
    name: file.name,
    size: `${(file.size / 1024).toFixed(0)} KB`,
    mime: contentType,
    r2Key,
    kind,
  };

  await d1Query(
    `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, metadata, created_at)
     VALUES (?, ?, ?, ?, 'file', ?, ?)`,
    [messageId, inquiryId, uid, file.name, JSON.stringify(metadata), now]
  );
  await bumpInquiryAndNotify(inquiryId, recipientId, now);

  return NextResponse.json({ id: messageId, created_at: now, metadata });
}
