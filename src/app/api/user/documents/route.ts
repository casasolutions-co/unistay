import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { uploadToR2 } from '@/lib/r2';

const DOC_TYPES = ['Rental agreement', 'Insurance certificate', 'Proof of address', 'Other document'];
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

// GET /api/user/documents — list the signed-in user's uploaded documents.
export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const documents = await d1Query(
    `SELECT id, doc_type, file_name, size_bytes, created_at
     FROM user_documents WHERE user_id = ? ORDER BY created_at DESC`,
    [uid]
  );

  return NextResponse.json({ documents });
}

// POST /api/user/documents — upload a document (multipart/form-data: file, docType).
// This is separate from identity verification (which runs entirely through Didit);
// it's general paperwork (lease, insurance, proof of address) a user shares from their account.
export async function POST(req: NextRequest) {
  const token = bearerToken(req);
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

  const file = formData.get('file') as File | null;
  const docType = formData.get('docType') as string | null;

  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });
  if (!docType || !DOC_TYPES.includes(docType)) {
    return NextResponse.json({ error: 'docType must be one of: ' + DOC_TYPES.join(', ') }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF, JPG or PNG files are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf';
  const buffer = Buffer.from(await file.arrayBuffer());
  const r2Key = `documents/${uid}/${crypto.randomUUID()}.${ext}`;

  try {
    await uploadToR2(r2Key, buffer, file.type);
  } catch (err) {
    console.error('[POST /api/user/documents]', err);
    return NextResponse.json({ error: 'Upload to storage failed. Please try again.' }, { status: 500 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await d1Query(
    `INSERT INTO user_documents (id, user_id, doc_type, file_name, r2_key, content_type, size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, uid, docType, file.name, r2Key, file.type, file.size, now]
  );

  return NextResponse.json({
    document: { id, doc_type: docType, file_name: file.name, size_bytes: file.size, created_at: now },
  });
}
