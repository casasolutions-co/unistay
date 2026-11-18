import { d1Query } from '@/lib/d1';
import { sendEmail } from '@/lib/email';
import { kycApprovedEmail, kycRejectedEmail } from '@/lib/emails/templates';

export type DiditDecision = { status?: string; session_url?: string; expires_at?: string; [key: string]: unknown };

// Only 'In Review' is a genuine pending state (Didit's manual review). Every other
// non-terminal status (Not Started, In Progress, Awaiting User, Resubmitted, ...) is just
// progress chatter we don't need to reflect — returns null for those.
const CANNOT_COMPLETE = new Set(['Declined', 'Abandoned', 'Expired', 'Kyc Expired']);

export function toVerificationStatus(diditStatus: string | undefined): string | null {
  if (diditStatus === 'Approved') return 'verified';
  if (diditStatus === 'In Review') return 'pending';
  if (diditStatus && CANNOT_COMPLETE.has(diditStatus)) return 'unverified';
  return null;
}

// Null when the session is unknown or Didit can't be reached.
export async function fetchDiditDecision(sessionId: string): Promise<DiditDecision | null> {
  try {
    const res = await fetch(`https://verification.didit.me/v3/session/${sessionId}/decision/`, {
      headers: { 'x-api-key': process.env.DIDIT_API_KEY! },
    });
    return res.ok ? await res.json() as DiditDecision : null;
  } catch (err) {
    console.error('[didit] session lookup failed', err);
    return null;
  }
}

// Statuses Didit is allowed to move a user out of. Anything else ('verified', or the admin
// panel's 'rejected' / 'banned') is final, so an admin decision is never overwritten by Didit.
export const DIDIT_OWNED_STATUSES = ['unverified', 'pending'];

// Writes a Didit outcome to the user row and emails them, but only when the status actually
// changes — so the webhook and the pull-based reconcile below never double-send.
export async function applyVerificationStatus(userId: string, status: string, decision: unknown) {
  const now = Date.now();
  const [changed] = await d1Query<{ email: string; name: string | null }>(
    `UPDATE users SET verification_status = ?, didit_decision_json = ?, decision_processed_at = ?, updated_at = ?
     WHERE id = ? AND verification_status IN ('unverified', 'pending') AND verification_status != ?
     RETURNING email, name`,
    [status, JSON.stringify(decision ?? {}), now, now, userId, status]
  );
  if (!changed) return;

  if (status === 'verified') {
    const { subject, html } = kycApprovedEmail({ name: changed.name });
    void sendEmail(changed.email, subject, html);
  } else if (status === 'unverified') {
    const { subject, html } = kycRejectedEmail({ name: changed.name });
    void sendEmail(changed.email, subject, html);
  }
}

// Fallback for when Didit's webhook never reached us (wrong webhook URL for this
// environment, delivery failure, ...): ask Didit directly and store the outcome.
// Returns the Didit decision so callers can reuse it.
export async function reconcileWithDidit(userId: string, sessionId: string) {
  const decision = await fetchDiditDecision(sessionId);
  const status = toVerificationStatus(decision?.status);
  if (decision && status) await applyVerificationStatus(userId, status, decision);
  return { decision, status };
}
