import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const res = await fetch('https://verification.didit.me/v2/session/', {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.DIDIT_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      callback: `https://app.casasolutions.co/verify?kyc=callback`,
      vendor_data: decoded.uid,
      contact_details: { email: decoded.email },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: 'Didit session creation failed', details: text }, { status: 502 });
  }

  const session = await res.json() as { session_id: string; url: string };

  await d1Query(
    `UPDATE users SET verification_status = 'pending', didit_session_id = ?, updated_at = ? WHERE id = ?`,
    [session.session_id, Date.now(), decoded.uid]
  );

  return NextResponse.json({ url: session.url, session_id: session.session_id });
}
