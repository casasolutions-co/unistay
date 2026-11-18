// Scheduled via netlify.toml (hourly). Keeps Firebase in step with the admin panel's bans:
// - active bans: account disabled in Firebase, so sign-in is refused (also catches anyone
//   banned before the admin panel started disabling accounts itself);
// - expired temporary bans: account re-enabled and ban cleared.
// The admin panel stores ban times in seconds.
import { d1Query } from '../../src/lib/d1'
import { adminAuth } from '../../src/lib/firebase-admin'

export const handler = async () => {
  const now = Math.floor(Date.now() / 1000)
  const banned = await d1Query<{ id: string; ban_expires_at: number | null }>(
    'SELECT id, ban_expires_at FROM users WHERE banned_at IS NOT NULL'
  )

  for (const { id, ban_expires_at } of banned) {
    const expired = ban_expires_at !== null && ban_expires_at <= now
    try {
      await adminAuth.updateUser(id, { disabled: !expired })
      if (expired) {
        // Their pre-ban status isn't stored, so they start unverified; a Didit-approved user
        // gets re-verified instantly from their old session when they click verify.
        await d1Query(
          `UPDATE users SET verification_status = CASE WHEN verification_status = 'banned' THEN 'unverified' ELSE verification_status END,
             banned_at = NULL, banned_by = NULL, ban_reason = NULL, ban_expires_at = NULL
           WHERE id = ?`,
          [id]
        )
      }
    } catch (err) {
      // e.g. the Firebase account was already deleted — skip, don't block the rest.
      console.error('[enforce-bans] failed for', id, err)
    }
  }
  console.log('[enforce-bans]', JSON.stringify({ checked: banned.length }))
}
