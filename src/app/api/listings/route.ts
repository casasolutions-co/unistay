import { NextRequest, NextResponse } from 'next/server'
import { searchPartnerListings } from '@/lib/listings/partner'
import { PROPERTIES } from '@/app/data/properties'
import type { UnifiedListing } from '@/lib/listings/types'
import { adminAuth } from '@/lib/firebase-admin'
import { d1Query } from '@/lib/d1'
import { getSignedUrl } from '@/lib/r2'
import { cityCoords } from '@/lib/city-coords'
import { geocodeAddress } from '@/lib/geocode'
import { getAppSetting } from '@/lib/settings'

const LIMIT = 20

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const city      = sp.get('city') ?? ''
  const minPrice  = sp.has('minPrice')  ? parseInt(sp.get('minPrice')!)  : undefined
  const maxPrice  = sp.has('maxPrice')  ? parseInt(sp.get('maxPrice')!)  : undefined
  const type      = sp.get('type')      ?? undefined
  const moveIn    = sp.get('moveIn')    ?? undefined
  const source    = sp.get('source')    ?? 'all'   // 'all' | 'CASA' | 'PARTNER' | 'PRIVATE'
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
  if (source === 'all' || source === 'PRIVATE') {
    const params: (string | number)[] = []
    const conditions: string[] = ["l.status = 'published'", "(l.source IS NULL OR l.source = 'private')"]

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
             l.lat, l.lng,
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
        lat: number; lng: number;
      }>(sql, params)

      const today = new Date().toISOString().slice(0, 10)
      hostListings = rows.map(r => {
        const storedLat = r.lat ?? 0;
        const storedLng = r.lng ?? 0;
        const fallback = cityCoords(r.city);
        return {
          id: r.id,
          source: 'private' as const,
          badge: 'PRIVATE' as const,
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
          lat: storedLat !== 0 ? storedLat : (fallback?.[0] ?? 0),
          lng: storedLng !== 0 ? storedLng : (fallback?.[1] ?? 0),
          coverPhoto: r.cover_r2_key ? getSignedUrl(r.cover_r2_key) : null,
          externalLink: null,
          rank: 70,
        };
      })
    } catch (err) {
      console.error('[GET /api/listings] D1 host query failed:', err)
    }
  }

  // ── CASA (legacy static entries, kept until fully migrated) ────
  const staticCasaListings: UnifiedListing[] = source !== 'PARTNER' && source !== 'PRIVATE'
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
          coverPhoto: p.photos?.[0]?.url ?? null,
          externalLink: null,
          rank: p.featured ? 100 : 80,
        }))
    : []

  // ── CASA (admin-curated, D1-backed) ────────────────────────────
  let d1CasaListings: UnifiedListing[] = []
  if (source === 'all' || source === 'CASA') {
    const params: (string | number)[] = []
    const conditions: string[] = ["l.status = 'published'", "l.source = 'casa'"]

    if (q) {
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
             l.lat, l.lng,
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
        lat: number; lng: number;
      }>(sql, params)

      const today = new Date().toISOString().slice(0, 10)
      d1CasaListings = rows.map(r => {
        const storedLat = r.lat ?? 0
        const storedLng = r.lng ?? 0
        const fallback = cityCoords(r.city)
        return {
          id: r.id,
          source: 'casa' as const,
          badge: 'CASA' as const,
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
          lat: storedLat !== 0 ? storedLat : (fallback?.[0] ?? 0),
          lng: storedLng !== 0 ? storedLng : (fallback?.[1] ?? 0),
          coverPhoto: r.cover_r2_key ? getSignedUrl(r.cover_r2_key) : null,
          externalLink: null,
          rank: 90,
        }
      })
    } catch (err) {
      console.error('[GET /api/listings] D1 CASA query failed:', err)
    }
  }

  const casaListings = [...d1CasaListings, ...staticCasaListings]

  // ── PARTNER (D1-backed, paginated; city optional — browses all when empty) ──
  const partnerResult = source !== 'CASA'
    ? await searchPartnerListings(city, { minPrice, maxPrice, type, moveIn }, page, LIMIT)
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

  if (!(await getAppSetting('listing_submission_enabled'))) {
    return NextResponse.json({ error: 'New listing submissions are temporarily paused.' }, { status: 403 });
  }

  const body = await req.json();
  const {
    listingId: clientListingId,
    ptype, title, streetName, houseNumber, city, postcode,
    bedrooms, bathrooms, roomSize, aptSize,
    amenities,
    desc, mates, numMates, mateGender, prefGender,
    rent, utilities, deposit,
    availFrom, availTo, openEnded,
    minPeriod, maxPeriod,
    photos,
  } = body;

  // Combine for storage and display: "Musterstraße 12a"
  const street = [streetName?.trim(), houseNumber?.trim()].filter(Boolean).join(' ');

  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });
  if (!streetName?.trim() || !city?.trim() || !postcode?.trim())
    return NextResponse.json({ error: 'full address required' }, { status: 400 });
  if (!rent?.trim()) return NextResponse.json({ error: 'rent required' }, { status: 400 });

  const now = Date.now();
  const listingId = (typeof clientListingId === 'string' && clientListingId.length === 36)
    ? clientListingId
    : crypto.randomUUID();

  // Ownership check — if this id was already autosaved as a draft, only its
  // own landlord may publish over it.
  const [existingRow] = await d1Query<{ landlord_id: string }>(
    'SELECT landlord_id FROM listings WHERE id = ?', [listingId]
  );
  if (existingRow && existingRow.landlord_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await d1Query(
      `INSERT INTO listings (
        id, landlord_id, ptype, title,
        street, city, postcode,
        bedrooms, bathrooms, size_sqm, room_size_sqm,
        cold_rent, utilities, deposit,
        avail_from, avail_to, open_ended,
        min_period, max_period,
        description,
        mate_count, mate_gender, pref_gender, mate_notes,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        ptype = excluded.ptype, title = excluded.title,
        street = excluded.street, city = excluded.city, postcode = excluded.postcode,
        bedrooms = excluded.bedrooms, bathrooms = excluded.bathrooms,
        size_sqm = excluded.size_sqm, room_size_sqm = excluded.room_size_sqm,
        cold_rent = excluded.cold_rent, utilities = excluded.utilities, deposit = excluded.deposit,
        avail_from = excluded.avail_from, avail_to = excluded.avail_to, open_ended = excluded.open_ended,
        min_period = excluded.min_period, max_period = excluded.max_period,
        description = excluded.description,
        mate_count = excluded.mate_count, mate_gender = excluded.mate_gender,
        pref_gender = excluded.pref_gender, mate_notes = excluded.mate_notes,
        status = 'pending_review', updated_at = excluded.updated_at`,
      [
        listingId, uid, ptype ?? 'studio', title.trim(),
        street.trim(), city.trim(), postcode.trim(),
        bedrooms ?? 1, bathrooms ?? 1, aptSize ?? 50, roomSize ?? 15,
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

    await d1Query('DELETE FROM listing_amenities WHERE listing_id = ?', [listingId]);
    for (const amenity of selectedAmenities) {
      await d1Query(
        'INSERT OR IGNORE INTO listing_amenities (listing_id, amenity) VALUES (?, ?)',
        [listingId, amenity]
      );
    }

    // Save photo metadata — actual files are already in R2
    const photoList: { r2Key: string; position: number; isCover: boolean }[] =
      Array.isArray(photos) ? photos : [];
    await d1Query('DELETE FROM listing_photos WHERE listing_id = ?', [listingId]);
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

    // Geocode the address and store coordinates (fire-and-forget — don't block the response)
    geocodeAddress(streetName.trim(), houseNumber?.trim() ?? '', city.trim(), postcode.trim()).then(coords => {
      if (coords) {
        d1Query(
          'UPDATE listings SET lat = ?, lng = ? WHERE id = ?',
          [coords.lat, coords.lng, listingId]
        ).catch(err => console.error('[geocode] D1 update failed:', err));
      }
    }).catch(err => console.error('[geocode] failed:', err));

    return NextResponse.json({ listing_id: listingId });
  } catch (err) {
    console.error('[POST /api/listings]', err);
    return NextResponse.json({ error: 'Failed to save listing. Please try again.' }, { status: 500 });
  }
}
