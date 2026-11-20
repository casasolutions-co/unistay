import { d1Query } from '../d1'
import type { UnifiedListing, ListingFilters } from './types'
import { matchingCities, inList } from './cities'
import type { Bbox } from '../mapArea'

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
  limit: number,
  near: [number, number] | null = null,
  sort?: 'price_asc' | 'price_desc',
  bbox: Bbox | null = null,
): Promise<{ listings: UnifiedListing[]; total: number; hasMore: boolean }> {
  const conditions: string[] = []
  const params: (string | number)[] = []

  // Unlike the old per-city JSON files, D1 has no cost to searching without a
  // city — so an empty query browses every partner listing instead of
  // silently returning none.
  // city column stores HousingAnywhere's own names ("Munich", "Offenbach",
  // "Garching bei München") — resolve the query against them first.
  if (bbox) {
    // "Search this area": the visible map bounds replace the city filter.
    conditions.push('lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?')
    params.push(bbox[0], bbox[2], bbox[1], bbox[3])
  } else if (city.trim()) {
    const cities = await matchingCities('partner_listings', city)
    if (!cities.length) return { listings: [], total: 0, hasMore: false }
    conditions.push(`city IN ${inList(cities.length)}`)
    params.push(...cities)
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
  // Nearest-first when the user picked an address: equirectangular squared
  // distance (lng scaled by cos(lat)) — exact enough for ordering within a city.
  let orderBy = 'rank DESC'
  const orderParams: number[] = []
  if (sort) {
    orderBy = sort === 'price_asc' ? 'price ASC' : 'price DESC'
  } else if (near) {
    const k = Math.cos(near[0] * Math.PI / 180)
    orderBy = '(lat - ?) * (lat - ?) + (lng - ?) * (lng - ?) * ?'
    orderParams.push(near[0], near[0], near[1], near[1], k * k)
  }
  const rows = await d1Query<{ raw_json: string }>(
    `SELECT raw_json FROM partner_listings ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, ...orderParams, limit, offset]
  )

  const listings = rows.map(r => mapListing(JSON.parse(r.raw_json)))
  return { listings, total, hasMore: offset + limit < total }
}
