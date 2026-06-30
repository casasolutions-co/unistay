import { NextRequest, NextResponse } from 'next/server'
import { searchPartnerListings } from '@/lib/listings/partner'
import { PROPERTIES } from '@/app/data/properties'
import type { UnifiedListing } from '@/lib/listings/types'
import { adminAuth } from '@/lib/firebase-admin'
import { d1Query } from '@/lib/d1'
import { getSignedUrl } from '@/lib/r2'

const LIMIT = 20

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const city      = sp.get('city') ?? ''
  const minPrice  = sp.has('minPrice')  ? parseInt(sp.get('minPrice')!)  : undefined
  const maxPrice  = sp.has('maxPrice')  ? parseInt(sp.get('maxPrice')!)  : undefined
  const type      = sp.get('type')      ?? undefined
  const moveIn    = sp.get('moveIn')    ?? undefined
  const source    = sp.get('source')    ?? 'all'   // 'all' | 'CASA' | 'PARTNER' | 'HOST'
  const page      = Math.max(1, parseInt(sp.get('page') ?? '1', 10))

  // Normalise umlauts so 'munich' matches 'München', 'berlin' matches 'Berlin' etc.
  const q = city.trim().toLowerCase()
    .replace(/ü/g, 'u').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ß/g, 'ss')

  // When a query normalises to an English city name, also match the German umlaut form.
  // e.g. "munich" should match both "munich" AND "münchen" (which normalises to "munchen")
  const CITY_SEARCH_ALTS: Record<string, string[]> = {
    'munich':    ['munich', 'munchen'],
    'cologne':   ['cologne', 'koln'],
    'nuremberg': ['nuremberg', 'nurnberg'],
    'dusseldorf': ['dusseldorf'],
    'frankfurt am main': ['frankfurt am main'],
  }
  const cityAlts = CITY_SEARCH_ALTS[q] ?? [q]

  // ── HOST (user-submitted listings in D1) ──────────────────────
  let hostListings: UnifiedListing[] = []
  if (source === 'all' || source === 'HOST') {
    const params: (string | number)[] = []
    const conditions: string[] = ["l.status IN ('published', 'draft')"]

    if (q) {
      // Normalise both sides so 'munich' matches 'München'; cityAlts also covers 'munchen' for 'münchen'
      const cityLikeClauses = cityAlts.map(() =>
        "LOWER(REPLACE(REPLACE(REPLACE(REPLACE(l.city,'ü','u'),'ä','a'),'ö','o'),'ß','ss')) LIKE ?"
      )
      conditions.push(`(${cityLikeClauses.join(' OR ')})`)
      for (const alt of cityAlts) params.push(`%${alt}%`)
    }
    if (minPrice !== undefined) {
      conditions.push('(l.cold_rent + l.utilities) >= ?')
      params.push(minPrice)
    }
    if (maxPrice !== undefined) {
      conditions.push('(l.cold_rent + l.utilities) <= ?')
      params.push(maxPrice)
    }
    if (type && type !== 'Any type') {
      conditions.push('l.ptype = ?')
      params.push(type)
    }
    if (moveIn) {
      conditions.push('(l.avail_from IS NULL OR l.avail_from <= ?)')
      params.push(moveIn)
    }

    const sql = `
      SELECT l.id, l.ptype, l.title, l.street, l.city, l.postcode,
             l.bedrooms, l.size_sqm, l.cold_rent, l.utilities,
             l.avail_from, l.open_ended, l.created_at,
             lp.r2_key as cover_r2_key
      FROM listings l
      LEFT JOIN listing_photos lp ON l.id = lp.listing_id AND lp.is_cover = 1
      WHERE ${conditions.join(' AND ')}
      ORDER BY l.created_at DESC
      LIMIT 50
    `

    try {
      const rows = await d1Query<{
        id: string; ptype: string; title: string;
        street: string; city: string; postcode: string;
        bedrooms: number; size_sqm: number;
        cold_rent: number; utilities: number;
        avail_from: string | null; open_ended: number;
        created_at: number; cover_r2_key: string | null;
      }>(sql, params)

      const today = new Date().toISOString().slice(0, 10)
      hostListings = rows.map(r => ({
        id: r.id,
        source: 'host' as const,
        badge: 'HOST' as const,
        title: r.title,
        address: `${r.street}, ${r.city}`,
        city: r.city,
        area: r.size_sqm,
        beds: r.bedrooms === 1 ? '1 bed' : `${r.bedrooms} beds`,
        price: r.cold_rent + r.utilities,
        type: r.ptype,
        avail: !r.avail_from || r.avail_from <= today ? 'Available now' : `From ${r.avail_from}`,
        availFrom: r.avail_from,
        now: !r.avail_from || r.avail_from <= today,
        incl: false,
        featured: false,
        lat: 0,
        lng: 0,
        coverPhoto: r.cover_r2_key ? getSignedUrl(r.cover_r2_key) : null,
        externalLink: null,
        rank: 70,
      }))
    } catch (err) {
      console.error('[GET /api/listings] D1 host query failed:', err)
    }
  }

  // ── CASA (static for now, moves to D1 later) ──────────────────
  const casaListings: UnifiedListing[] = source !== 'PARTNER' && source !== 'HOST'
    ? PROPERTIES
        .filter(p => p.badge === 'CASA')
        .filter(p => !q || cityAlts.some(alt => p.city.toLowerCase().replace(/ü/g, 'u').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ß/g, 'ss').includes(alt)))
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

  // Page 1: HOST + CASA first, then partners. Page 2+: partners only.
  const listings = page === 1
    ? [...hostListings, ...casaListings, ...partnerResult.listings]
    : partnerResult.listings

  return NextResponse.json({
    listings,
    page,
    hostCount: hostListings.length,
    casaCount: casaListings.length,
    partnerTotal: partnerResult.total,
    total: hostListings.length + casaListings.length + partnerResult.total,
    hasMore: partnerResult.hasMore,
  })
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await req.json();
  const {
    listingId: clientListingId,
    ptype, title, street, city, postcode,
    bedrooms, bathrooms, size, floor,
    amenities,
    desc, mates, numMates, mateGender, prefGender,
    rent, utilities, deposit,
    availFrom, availTo, openEnded,
    minPeriod, maxPeriod,
    photos,
  } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });
  if (!street?.trim() || !city?.trim() || !postcode?.trim())
    return NextResponse.json({ error: 'full address required' }, { status: 400 });
  if (!rent?.trim()) return NextResponse.json({ error: 'rent required' }, { status: 400 });

  const now = Date.now();
  const listingId = (typeof clientListingId === 'string' && clientListingId.length === 36)
    ? clientListingId
    : crypto.randomUUID();

  try {
    await d1Query(
      `INSERT INTO listings (
        id, landlord_id, ptype, title,
        street, city, postcode,
        bedrooms, bathrooms, size_sqm, floor,
        cold_rent, utilities, deposit,
        avail_from, avail_to, open_ended,
        min_period, max_period,
        description,
        mate_count, mate_gender, pref_gender, mate_notes,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
      [
        listingId, uid, ptype ?? 'studio', title.trim(),
        street.trim(), city.trim(), postcode.trim(),
        bedrooms ?? 1, bathrooms ?? 1, size ?? 30, floor ?? 1,
        parseInt(rent) || 0, parseInt(utilities) || 0, parseInt(deposit) || 0,
        availFrom || null, availTo || null, openEnded ? 1 : 0,
        minPeriod ? parseInt(minPeriod) : null, maxPeriod ? parseInt(maxPeriod) : null,
        desc?.trim() ?? '',
        numMates ?? 0, mateGender || null, prefGender || null, mates?.trim() || null,
        now, now,
      ]
    );

    const selectedAmenities: string[] = Object.entries(amenities ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k);

    for (const amenity of selectedAmenities) {
      await d1Query(
        'INSERT OR IGNORE INTO listing_amenities (listing_id, amenity) VALUES (?, ?)',
        [listingId, amenity]
      );
    }

    // Save photo metadata — actual files are already in R2
    const photoList: { r2Key: string; position: number; isCover: boolean }[] =
      Array.isArray(photos) ? photos : [];
    for (const photo of photoList) {
      await d1Query(
        `INSERT INTO listing_photos (id, listing_id, r2_key, position, is_cover)
         VALUES (?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          listingId,
          photo.r2Key,
          photo.position,
          photo.isCover ? 1 : 0,
        ]
      );
    }

    return NextResponse.json({ listing_id: listingId });
  } catch (err) {
    console.error('[POST /api/listings]', err);
    return NextResponse.json({ error: 'Failed to save listing. Please try again.' }, { status: 500 });
  }
}
