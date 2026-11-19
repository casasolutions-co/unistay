// Scheduled via netlify.toml (every 15 min). Safety net for the Didit webhook: pulls
// the decision for every open session and writes it to the DB, so a user who finished
// verification shows as verified (here and in the admin panel) even if the webhook
// never arrived and they never reopen the app.
import { d1Query } from '../../src/lib/d1'
import { reconcileWithDidit } from '../../src/lib/didit'

export const handler = async () => {
  // Open = a session exists and no final Didit outcome is stored for it yet.
  // Sessions older than 14 days are dead (Didit expires them) — skip.
  const cutoff = Date.now() - 14 * 24 * 3600 * 1000
  const open = await d1Query<{ id: string; didit_session_id: string }>(
    `SELECT id, didit_session_id FROM users
     WHERE didit_session_id IS NOT NULL AND updated_at > ?
       AND (verification_status = 'pending' OR (COALESCE(verification_status, 'unverified') = 'unverified' AND decision_processed_at IS NULL))
     LIMIT 200`,
    [cutoff]
  )
  const results: Record<string, number> = {}
  for (const { id, didit_session_id } of open) {
    try {
      const { status } = await reconcileWithDidit(id, didit_session_id)
      results[status ?? 'open'] = (results[status ?? 'open'] ?? 0) + 1
    } catch (err) {
      console.error('[sync-kyc] failed for', id, err)
    }
  }
  console.log('[sync-kyc]', JSON.stringify({ checked: open.length, ...results }))
}
