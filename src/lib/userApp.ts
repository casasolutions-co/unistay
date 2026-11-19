// Tells the student app (app.casasolutions.co) to drop its cached search results, so
// admin listing changes show up immediately instead of after its 5-minute cache.
// Best-effort: a failure only delays visibility, it never blocks the admin action.
// Needs USER_APP_URL (defaults to prod) and INTERNAL_REVALIDATE_SECRET (same value as
// the student app's) in this site's environment.
export async function refreshUserAppListings() {
  const secret = process.env.INTERNAL_REVALIDATE_SECRET
  if (!secret) {
    console.warn('[userApp] INTERNAL_REVALIDATE_SECRET not set — student app will update within 5 min')
    return
  }
  const base = process.env.USER_APP_URL ?? 'https://app.casasolutions.co'
  try {
    const res = await fetch(`${base}/api/internal/revalidate-listings`, {
      method: 'POST',
      headers: { 'x-internal-secret': secret },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.error('[userApp] revalidate failed', res.status)
  } catch (err) {
    console.error('[userApp] revalidate failed', err)
  }
}
