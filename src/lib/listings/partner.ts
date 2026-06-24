import fs from 'fs'
import path from 'path'
import type { UnifiedListing, ListingFilters } from './types'

function citySlug(city: string): string {
  return city.toLowerCase().replace(/[/\\]/g, '-').replace(/\s+/g, '-')
}

function mapType(kindLabel: string, bedrooms: number): string {
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

export function searchPartnerListings(
  city: string,
  filters: ListingFilters,
  page: number,
  limit: number
): { listings: UnifiedListing[]; total: number; hasMore: boolean } {
  const filePath = path.join(process.cwd(), 'public', 'partner-cities', `${citySlug(city)}.json`)

  if (!fs.existsSync(filePath)) {
    return { listings: [], total: 0, hasMore: false }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw: any[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  const filtered = raw.filter(l => {
    const price = l.costs.price / 100
    if (filters.minPrice !== undefined && price < filters.minPrice) return false
    if (filters.maxPrice !== undefined && price > filters.maxPrice) return false

    if (filters.type && filters.type !== 'Any type') {
      const bedrooms = parseInt(l.facilities?.bedrooms?.value ?? '1', 10) || 1
      if (mapType(l.kindLabel, bedrooms) !== filters.type) return false
    }

    if (filters.moveIn) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasWindow = l.available?.some((w: any) => w.from <= filters.moveIn!)
      if (!hasWindow) return false
    }

    return true
  })

  filtered.sort((a, b) => b.rank - a.rank)

  const total = filtered.length
  const offset = (page - 1) * limit
  const listings = filtered.slice(offset, offset + limit).map(mapListing)

  return { listings, total, hasMore: offset + limit < total }
}
