import { NextRequest, NextResponse } from 'next/server'
import { searchPartnerListings } from '@/lib/listings/partner'
import { PROPERTIES } from '@/app/data/properties'
import type { UnifiedListing } from '@/lib/listings/types'

const LIMIT = 20

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const city      = sp.get('city') ?? ''
  const minPrice  = sp.has('minPrice')  ? parseInt(sp.get('minPrice')!)  : undefined
  const maxPrice  = sp.has('maxPrice')  ? parseInt(sp.get('maxPrice')!)  : undefined
  const type      = sp.get('type')      ?? undefined
  const moveIn    = sp.get('moveIn')    ?? undefined
  const source    = sp.get('source')    ?? 'all'   // 'all' | 'CASA' | 'PARTNER'
  const page      = Math.max(1, parseInt(sp.get('page') ?? '1', 10))

  const q = city.trim().toLowerCase()

  // ── CASA (static for now, moves to D1 later) ──────────────────
  const casaListings: UnifiedListing[] = source !== 'PARTNER'
    ? PROPERTIES
        .filter(p => p.badge === 'CASA')
        .filter(p => !q || p.city.toLowerCase().includes(q))
        .filter(p => minPrice === undefined || p.price >= minPrice)
        .filter(p => maxPrice === undefined || p.price <= maxPrice)
        .filter(p => !type || type === 'Any type' || p.type === type)
        .map(p => ({
          id: p.id,
          source: 'casa',
          badge: 'CASA',
          title: p.title,
          address: p.address,
          city: p.city,
          area: p.area,
          beds: p.beds,
          price: p.price,
          type: p.type,
          avail: p.avail,
          availFrom: null,
          now: p.now,
          incl: p.incl,
          featured: p.featured,
          lat: p.lat,
          lng: p.lng,
          coverPhoto: null,
          externalLink: null,
          rank: p.featured ? 100 : 80,
        }))
    : []

  // ── PARTNER (JSON files, paginated) ───────────────────────────
  const partnerResult = source !== 'CASA' && q
    ? searchPartnerListings(city, { minPrice, maxPrice, type, moveIn }, page, LIMIT)
    : { listings: [], total: 0, hasMore: false }

  // Page 1: CASA first, then partners. Page 2+: partners only.
  const listings = page === 1
    ? [...casaListings, ...partnerResult.listings]
    : partnerResult.listings

  return NextResponse.json({
    listings,
    page,
    casaCount: casaListings.length,
    partnerTotal: partnerResult.total,
    total: casaListings.length + partnerResult.total,
    hasMore: partnerResult.hasMore,
  })
}
