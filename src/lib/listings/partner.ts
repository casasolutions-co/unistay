import { d1Query } from '../d1'
import type { UnifiedListing, ListingFilters } from './types'

const CITY_ALIASES: Record<string, string> = {
  'cologne': 'köln',
  'koln': 'köln',
  'nuremberg': 'nürnberg',
  'nuremburg': 'nürnberg',
  'nuernberg': 'nürnberg',
  'munster': 'münster',
  'muenster': 'münster',
  'dusseldorf': 'düsseldorf',
  'duesseldorf': 'düsseldorf',
}

export function citySlug(city: string): string {
  const raw = city.toLowerCase().replace(/[/\\]/g, '-').replace(/\s+/g, '-')
  return CITY_ALIASES[raw] ?? raw
}

export function mapType(kindLabel: string, bedrooms: number): string {
  if (kindLabel === 'shared room' || kindLabel === 'private room') return 'Shared flat (WG)'
  if (bedrooms >= 2) return '2+ bedrooms'
  return '1-bedroom apartment'
}

function formatAvail(iso: string | null): string {
  if (!iso || iso === '9999-12-31') return 'Available now'
  const today = new Date().toISOString().slice(0, 10)
  if (iso <= today) return 'Available now'
  const [, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `From ${parseInt(d)} ${months[parseInt(m) - 1]}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapListing(l: any): UnifiedListing {
  const bedrooms = parseInt(l.facilities?.bedrooms?.value ?? '1', 10) || 1
  const price = Math.round(l.costs.price / 100)
  const availFrom: string | null = l.available?.[0]?.from ?? null
  const today = new Date().toISOString().slice(0, 10)
  const isNow = !availFrom || availFrom <= today
  const inclUtilities =
    l.facilities?.electricityCostIncluded?.value === 'yes' &&
    l.facilities?.waterCostIncluded?.value === 'yes'
  const area =
    parseInt(l.facilities?.bedroomSize?.value ?? '0', 10) ||
    parseInt(l.facilities?.totalSize?.value ?? '0', 10)

  return {
    id: `partner-${l.id}`,
    source: 'partner',
    badge: 'PARTNER',
    title: l.title,
    address: `${l.location.street}, ${l.location.city}`,
    city: l.location.city,
    area,
    beds: bedrooms === 1 ? '1 bed' : `${bedrooms} beds`,
    price,
    type: mapType(l.kindLabel, bedrooms),
    avail: formatAvail(availFrom),
    availFrom,
    now: isNow,
    incl: inclUtilities,
    featured: false,
    lat: parseFloat(l.location.coordinates.latitude),
    lng: parseFloat(l.location.coordinates.longitude),
    coverPhoto: l.images?.[0]?.sizes?.['640x480']?.link ?? null,
    externalLink: l.originalLink ?? null,
    rank: l.rank ?? 0,
  }
}

export async function searchPartnerListings(
  city: string,
  filters: ListingFilters,
  page: number,
  limit: number
): Promise<{ listings: UnifiedListing[]; total: number; hasMore: boolean }> {
  const conditions: string[] = []
  const params: (string | number)[] = []

  // Unlike the old per-city JSON files, D1 has no cost to searching without a
  // city — so an empty query browses every partner listing instead of
  // silently returning none.
  const slug = citySlug(city)
  if (slug) {
    // city column stores HousingAnywhere's real city name (e.g. "Frankfurt am
    // Main"); matching on its slugified prefix preserves the old file-based
    // behaviour where a "frankfurt" search matched "frankfurt-am-main.json".
    conditions.push("LOWER(REPLACE(city, ' ', '-')) LIKE ? || '%'")
    params.push(slug)
  }

  if (filters.minPrice !== undefined) { conditions.push('price >= ?'); params.push(filters.minPrice) }
  if (filters.maxPrice !== undefined) { conditions.push('price <= ?'); params.push(filters.maxPrice) }
  if (filters.type && filters.type !== 'Any type') { conditions.push('ptype = ?'); params.push(filters.type) }
  if (filters.moveIn) { conditions.push('(avail_from IS NULL OR avail_from <= ?)'); params.push(filters.moveIn) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const [{ total }] = await d1Query<{ total: number }>(
    `SELECT COUNT(*) as total FROM partner_listings ${where}`, params
  )
  const rows = await d1Query<{ raw_json: string }>(
    `SELECT raw_json FROM partner_listings ${where} ORDER BY rank DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const listings = rows.map(r => mapListing(JSON.parse(r.raw_json)))
  return { listings, total, hasMore: offset + limit < total }
}
