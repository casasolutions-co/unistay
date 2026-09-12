// Scheduled via netlify.toml (every 6h). Named "-background" so Netlify
// gives it the 15-minute budget instead of a regular function's ~10-26s —
// needed because the first backfill upserts ~6,400 rows one at a time (see
// partner-sync.ts). Fires and forgets; check Netlify's function logs for
// the result line, there's no caller waiting on a response.
import { syncPartnerListings } from '../../src/lib/listings/partner-sync'

// This function runs outside the Next.js app (a separate Netlify Function),
// so it can't import and call revalidateTag directly — it has no Next
// request context, and doing so throws. Instead it pokes an internal Next
// route that can. Deliberately best-effort and never lets a revalidation
// failure touch the sync's own success/failure or its D1 writes: worst case,
// the /api/listings response cache just falls back to its normal 5-minute
// TTL instead of updating immediately.
async function notifyListingsChanged() {
  const secret = process.env.INTERNAL_REVALIDATE_SECRET
  const base = process.env.URL
  if (!secret || !base) return
  try {
    await fetch(`${base}/api/internal/revalidate-listings`, {
      method: 'POST',
      headers: { 'x-internal-secret': secret },
    })
  } catch (err) {
    console.error('[sync-partner-listings] cache revalidation failed:', err)
  }
}

export const handler = async () => {
  try {
    const result = await syncPartnerListings()
    console.log('[sync-partner-listings]', JSON.stringify(result))
    if (result.upserted > 0 || result.delisted > 0) await notifyListingsChanged()
  } catch (err) {
    console.error('[sync-partner-listings] failed:', err)
  }
}
