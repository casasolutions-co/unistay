import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { d1Query } from '@/lib/d1';
import { PROPERTIES } from '@/app/data/properties';

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // All inquiries where the current user is the student or the landlord of the listing.
  // Returns one row per inquiry with the latest message preview and unread count.
  const threads = await d1Query<{
    inquiry_id: string;
    listing_id: string | null;
    listing_title: string | null;
    listing_city: string | null;
    cold_rent: number | null;
    landlord_id: string | null;
    student_id: string;
    type: string;
    subject: string | null;
    ticket_no: number | null;
    other_id: string | null;
    other_name: string | null;
    other_role: string | null;
    last_body: string | null;
    last_type: string | null;
    last_sender_id: string | null;
    last_at: number | null;
    unread_count: number;
  }>(
    `SELECT
       i.id          AS inquiry_id,
       i.listing_id,
       l.title       AS listing_title,
       l.city        AS listing_city,
       l.cold_rent,
       l.landlord_id,
       i.student_id,
       i.type,
       i.subject,
       i.ticket_no,
       CASE WHEN i.type = 'support' THEN NULL
            ELSE CASE WHEN i.student_id = ? THEN l.landlord_id ELSE i.student_id END END AS other_id,
       CASE WHEN i.type = 'support' THEN 'UniStay Support' ELSE ou.name END AS other_name,
       CASE WHEN i.type = 'support' THEN 'support' ELSE ou.role END AS other_role,
       m.body        AS last_body,
       m.msg_type    AS last_type,
       m.sender_id   AS last_sender_id,
       m.created_at  AS last_at,
       (SELECT COUNT(*) FROM messages
        WHERE inquiry_id = i.id AND sender_id != ? AND read_at IS NULL) AS unread_count
     FROM inquiries i
     LEFT JOIN listings l ON l.id = i.listing_id
     LEFT JOIN users ou ON ou.id = CASE WHEN i.student_id = ? THEN l.landlord_id ELSE i.student_id END
     LEFT JOIN messages m ON m.id = (
       SELECT id FROM messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1
     )
     WHERE i.student_id = ? OR l.landlord_id = ?
     ORDER BY COALESCE(m.created_at, i.created_at) DESC`,
    [uid, uid, uid, uid, uid]
  );

  // Fill in listing info for static/partner listings that aren't in D1
  const enriched = threads.map(t => {
    if (t.listing_title) return t;
    const prop = PROPERTIES.find(p => p.id === t.listing_id);
    if (!prop) return t;
    return {
      ...t,
      listing_title: prop.title,
      listing_city: prop.city,
      cold_rent: prop.coldRent,
    };
  });

  // Hide threads the user has "deleted" — they reappear once a newer message arrives,
  // since there's no per-user archive flag on `inquiries` to hide them permanently.
  const [me] = await d1Query<{ preferences: string | null }>(
    'SELECT preferences FROM users WHERE id = ?',
    [uid]
  );
  const prefs = me?.preferences ? JSON.parse(me.preferences) : {};
  const hiddenThreads: Record<string, number> = prefs.hiddenThreads ?? {};
  const visible = enriched.filter(t => {
    const hiddenAt = hiddenThreads[t.inquiry_id];
    return hiddenAt === undefined || (t.last_at ?? 0) > hiddenAt;
  });

  return NextResponse.json({ threads: visible });
}
