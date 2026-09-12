import { d1Query } from '../d1'
import { mapType } from './partner'

const FEED_URL = 'https://housinganywhere.com/feeds/CASASolutions/CASASolutions.json'

// Below this fraction of the previously-known count, treat the fetch as
// partial/broken rather than a real mass delisting — skip deletions instead
// of wiping the table over a truncated response.
const MIN_FEED_RATIO = 0.5

// D1's REST API caps bound parameters at 100/query (Cloudflare docs). The
// upsert binds 11 params/row, so 9 rows/statement is the most that fits;
// a plain `IN (...)` delete binds 1 param/id, so 100 ids/statement.
const UPSERT_COLS = 11
const UPSERT_CHUNK = Math.floor(100 / UPSERT_COLS)
const DELETE_CHUNK = 100

export interface SyncResult {
  fetched: number
  upserted: number
  delisted: number
  skippedDelisting: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeedItem = any

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function syncPartnerListings(): Promise<SyncResult> {
  const res = await fetch(FEED_URL)
  if (!res.ok) throw new Error(`HousingAnywhere feed fetch failed: ${res.status}`)
  const feed = await res.json() as { listings: FeedItem[] }
  const items = feed.listings ?? []
  if (items.length === 0) throw new Error('HousingAnywhere feed returned no listings')

  const existing = await d1Query<{ remote_id: string; remote_updated: string }>(
    'SELECT remote_id, remote_updated FROM partner_listings'
  )
  const known = new Map(existing.map(r => [r.remote_id, r.remote_updated]))
  const feedIds = new Set<string>()

  // HousingAnywhere's own `updated` timestamp is the change-detection key —
  // only rows that actually changed since the last sync get written at all.
  const changed: FeedItem[] = []
  for (const item of items) {
    const remoteId = String(item.id)
    feedIds.add(remoteId)
    if (known.get(remoteId) !== item.updated) changed.push(item)
  }

  const now = Date.now()
  for (const batch of chunk(changed, UPSERT_CHUNK)) {
    const values = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
    const params: (string | number | null)[] = []
    for (const item of batch) {
      const remoteId = String(item.id)
      const bedrooms = parseInt(item.facilities?.bedrooms?.value ?? '1', 10) || 1
      params.push(
        `partner-${remoteId}`, remoteId, item.updated, item.location.city,
        Math.round(item.costs.price / 100), mapType(item.kindLabel, bedrooms),
        item.available?.[0]?.from ?? null, item.rank ?? 0, JSON.stringify(item), now, now,
      )
    }
    await d1Query(
      `INSERT INTO partner_listings
         (id, remote_id, remote_updated, city, price, ptype, avail_from, rank, raw_json, created_at, updated_at)
       VALUES ${values}
       ON CONFLICT(remote_id) DO UPDATE SET
         remote_updated = excluded.remote_updated, city = excluded.city, price = excluded.price,
         ptype = excluded.ptype, avail_from = excluded.avail_from,
         rank = excluded.rank, raw_json = excluded.raw_json, updated_at = excluded.updated_at`,
      params
    )
  }

  // Anything previously known but absent from this fetch has been delisted
  // upstream — unless the feed came back suspiciously small, which usually
  // means a bad/partial fetch, not thousands of listings vanishing at once.
  const skippedDelisting = items.length < existing.length * MIN_FEED_RATIO
  let delisted = 0
  if (!skippedDelisting) {
    const gone = existing.filter(r => !feedIds.has(r.remote_id)).map(r => r.remote_id)
    for (const batch of chunk(gone, DELETE_CHUNK)) {
      await d1Query(
        `DELETE FROM partner_listings WHERE remote_id IN (${batch.map(() => '?').join(', ')})`,
        batch
      )
      delisted += batch.length
    }
  }

  return { fetched: items.length, upserted: changed.length, delisted, skippedDelisting }
}
