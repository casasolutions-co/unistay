import { d1Query } from './d1';

export function bearerToken(req: { headers: { get(name: string): string | null } }): string | null {
  const h = req.headers.get('authorization') ?? '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

export async function verifyParticipant(uid: string, inquiryId: string): Promise<boolean> {
  const rows = await d1Query(
    `SELECT i.id FROM inquiries i
     LEFT JOIN listings l ON l.id = i.listing_id
     WHERE i.id = ? AND (i.student_id = ? OR l.landlord_id = ?)`,
    [inquiryId, uid, uid]
  );
  return rows.length > 0;
}

// Resolves the other participant in an inquiry. LEFT JOIN so support tickets
// (listing_id IS NULL) don't disqualify the query.
export async function resolveRecipient(
  uid: string,
  inquiryId: string
): Promise<{ type: string; recipientId: string | null } | null> {
  const [inquiry] = await d1Query<{ type: string; student_id: string; landlord_id: string | null }>(
    `SELECT i.type, i.student_id, l.landlord_id
     FROM inquiries i LEFT JOIN listings l ON l.id = i.listing_id
     WHERE i.id = ?`,
    [inquiryId]
  );
  if (!inquiry) return null;
  const recipientId = inquiry.student_id === uid ? inquiry.landlord_id : inquiry.student_id;
  return { type: inquiry.type, recipientId };
}

// True if either side has blocked the other via `users.preferences.blockedUsers`.
export async function isBlockedPair(uid: string, otherId: string): Promise<boolean> {
  const rows = await d1Query<{ id: string; preferences: string | null }>(
    'SELECT id, preferences FROM users WHERE id IN (?, ?)',
    [uid, otherId]
  );
  const myPrefs = rows.find(r => r.id === uid)?.preferences;
  const theirPrefs = rows.find(r => r.id === otherId)?.preferences;
  const myBlocked: string[] = myPrefs ? (JSON.parse(myPrefs).blockedUsers ?? []) : [];
  const theirBlocked: string[] = theirPrefs ? (JSON.parse(theirPrefs).blockedUsers ?? []) : [];
  return myBlocked.includes(otherId) || theirBlocked.includes(uid);
}

// Keeps the inbox sorted by latest activity and bumps the recipient's unread counter.
export async function bumpInquiryAndNotify(
  inquiryId: string,
  recipientId: string | null,
  now: number
): Promise<void> {
  await d1Query(`UPDATE inquiries SET updated_at = ? WHERE id = ?`, [now, inquiryId]);
  if (recipientId) {
    await d1Query(
      `INSERT INTO user_inbox_counts (user_id, unread) VALUES (?, 1)
       ON CONFLICT(user_id) DO UPDATE SET unread = unread + 1`,
      [recipientId]
    );
  }
}
