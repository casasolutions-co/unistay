// Scheduled via netlify.toml (every 6h). Named "-background" so Netlify
// gives it the 15-minute budget instead of a regular function's ~10-26s —
// needed because the first backfill upserts ~6,400 rows one at a time (see
// partner-sync.ts). Fires and forgets; check Netlify's function logs for
// the result line, there's no caller waiting on a response.
import { syncPartnerListings } from '../../src/lib/listings/partner-sync'

export const handler = async () => {
  try {
    const result = await syncPartnerListings()
    console.log('[sync-partner-listings]', JSON.stringify(result))
  } catch (err) {
    console.error('[sync-partner-listings] failed:', err)
  }
}
