import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PROPERTIES } from '@/app/data/properties'
import { ICON_PATHS } from '@/app/data/properties'
import { d1Query } from '@/lib/d1'
import { getSignedUrl } from '@/lib/r2'
import { cityCoords } from '@/lib/city-coords'
import { adminAuth } from '@/lib/firebase-admin'

function bearerUid(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return Promise.resolve(null)
  return adminAuth.verifyIdToken(token).then(d => d.uid).catch(() => null)
}

// Best-effort split of a stored "Musterstraße 12a" string back into the
// streetName/houseNumber pair the List Your Place form edits separately.
function splitStreet(street: string): { streetName: string; houseNumber: string } {
  const s = (street ?? '').trim()
  const m = s.match(/^(.*?)[,]?\s+(\d[\w-]*)$/)
  return m ? { streetName: m[1].trim(), houseNumber: m[2].trim() } : { streetName: s, houseNumber: '' }
}

const CITIES_DIR = path.join(process.cwd(), 'public', 'partner-cities')

function facilityAmenities(facilities: Record<string, { value: string }>) {
  const map: { key: string; label: string; icon: string }[] = [
    { key: 'wifi',           label: 'Wi-Fi',           icon: ICON_PATHS.wifi },
    { key: 'washingMachine', label: 'Washing machine',  icon: ICON_PATHS.washer },
    { key: 'heating',        label: 'Central heating',  icon: ICON_PATHS.heating },
    { key: 'balconyTerrace', label: 'Balcony/terrace',  icon: ICON_PATHS.balcony },
    { key: 'parking',        label: 'Parking',          icon: ICON_PATHS.bike },
    { key: 'dishwasher',     label: 'Dishwasher',       icon: ICON_PATHS.kitchen },
  ]
  return map
    .filter(a => facilities?.[a.key]?.value === 'yes')
    .map(a => ({ label: a.label, icon: a.icon }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPartnerDetail(l: any) {
  const price = Math.round(l.costs.price / 100)
  const bedrooms = parseInt(l.facilities?.bedrooms?.value ?? '1', 10) || 1
  const availFrom: string | null = l.available?.[0]?.from ?? null
  const today = new Date().toISOString().slice(0, 10)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- l is the raw partner API response, typed any above
  const photos = (l.images ?? []).map((img: any, i: number) => ({
    url: img.sizes?.['1024x768']?.link ?? img.sizes?.['640x480']?.link ?? null,
    label: img.categories?.[0] ?? `photo ${i + 1}`,
  }))

  return {
    id: `partner-${l.id}`,
    source: 'partner',
    badge: 'PARTNER',
    title: l.title,
    address: `${l.location.street}, ${l.location.city}`,
    city: l.location.city,
    area: parseInt(l.facilities?.totalSize?.value ?? '0', 10) || parseInt(l.facilities?.bedroomSize?.value ?? '0', 10),
    beds: bedrooms === 1 ? '1 bed' : `${bedrooms} beds`,
    bathrooms: l.facilities?.bathroom?.value?.replace(/_/g, ' ') ?? '—',
    floor: '—',
    price,
    coldRent: price,
    utilities: Math.round((l.costs.estimatedBills ?? 0) / 100),
    deposit: Math.round(l.costs.deposit / 100),
    serviceFee: 0,
    type: l.kindLabel,
    avail: availFrom && availFrom > today ? `From ${availFrom}` : 'Available now',
    now: !availFrom || availFrom <= today,
    incl: l.facilities?.electricityCostIncluded?.value === 'yes',
    description: l.description ?? '',
    photos,
    amenities: facilityAmenities(l.facilities ?? {}),
    lat: parseFloat(l.location.coordinates.latitude),
    lng: parseFloat(l.location.coordinates.longitude),
    externalLink: l.originalLink ?? null,
    hostName: 'HousingAnywhere',
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // D1 listing (published via List Your Place)
  if (UUID_RE.test(id)) {
    const [row] = await d1Query<{
      id: string; ptype: string; title: string;
      street: string; city: string; postcode: string;
      bedrooms: number; bathrooms: number; size_sqm: number; room_size_sqm: number;
      cold_rent: number; utilities: number; deposit: number;
      avail_from: string | null; avail_to: string | null; open_ended: number;
      min_period: number | null; max_period: number | null;
      description: string;
      mate_count: number; mate_gender: string | null; pref_gender: string | null; mate_notes: string | null;
      status: string;
      landlord_id: string;
      landlord_name: string | null;
      source: string | null;
      lat: number; lng: number;
    }>(
      `SELECT l.*, u.name AS landlord_name
       FROM listings l
       LEFT JOIN users u ON u.id = l.landlord_id
       WHERE l.id = ?`,
      [id]
    )

    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Only the listing's own landlord may view it once it's off the public
    // market (draft/pending_review/rented/archived) — e.g. the "Preview" and
    // "Edit" actions on My Listings. Everyone else only sees published listings.
    if (row.status !== 'published') {
      const uid = await bearerUid(req)
      if (uid !== row.landlord_id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    const amenityRows = await d1Query<{ amenity: string }>(
      'SELECT amenity FROM listing_amenities WHERE listing_id = ?', [id]
    )
    const photoRows = await d1Query<{ r2_key: string; position: number; is_cover: number }>(
      'SELECT r2_key, position, is_cover FROM listing_photos WHERE listing_id = ? ORDER BY position ASC', [id]
    )

    const warm = row.cold_rent + row.utilities
    const today = new Date().toISOString().slice(0, 10)
    const availFrom = row.avail_from ?? today

    const isCasa = row.source === 'casa'

    const listing = {
      id: row.id,
      source: isCasa ? 'casa' : 'private',
      badge: isCasa ? 'CASA' : 'PRIVATE',
      title: row.title,
      address: `${row.street}, ${row.city}`,
      city: row.city,
      area: row.size_sqm,
      roomSize: row.room_size_sqm || null,
      beds: row.bedrooms === 1 ? '1 bed' : `${row.bedrooms} beds`,
      bathrooms: String(row.bathrooms),
      price: warm,
      coldRent: row.cold_rent,
      utilities: row.utilities,
      deposit: row.deposit,
      serviceFee: 0,
      type: row.ptype,
      avail: availFrom <= today ? 'Available now' : `From ${availFrom}`,
      now: availFrom <= today,
      incl: false,
      featured: false,
      lat: (row.lat && row.lat !== 0) ? row.lat : (cityCoords(row.city)?.[0] ?? 0),
      lng: (row.lng && row.lng !== 0) ? row.lng : (cityCoords(row.city)?.[1] ?? 0),
      description: row.description,
      photos: photoRows.map((p, i) => ({ r2_key: p.r2_key, label: `photo ${i + 1}`, url: getSignedUrl(p.r2_key) })),
      amenities: amenityRows.map(a => ({ label: a.amenity, icon: ICON_PATHS.wifi })),
      nearby: [],
      hostName: isCasa ? 'UniStay CASA' : (row.landlord_name ?? 'Private landlord'),
      hostType: isCasa ? 'CASA' : 'Private',
      hostListings: '1',
      landlord_id: row.landlord_id,
      status: row.status,
    }

    // Raw form-shaped fields for the List Your Place resume flow (edit/resume a
    // draft or a published listing) — kept separate from `listing` above since
    // that object is display-formatted for the public preview page.
    const { streetName, houseNumber } = splitStreet(row.street)
    const formFields = {
      ptype: row.ptype,
      title: row.title,
      streetName, houseNumber,
      city: row.city, postcode: row.postcode,
      bedrooms: row.bedrooms, bathrooms: row.bathrooms,
      roomSize: row.room_size_sqm, aptSize: row.size_sqm,
      amenities: Object.fromEntries(amenityRows.map(a => [a.amenity, true])),
      desc: row.description,
      mates: row.mate_notes ?? '', numMates: row.mate_count ?? 0,
      mateGender: row.mate_gender ?? '', prefGender: row.pref_gender ?? 'any',
      rent: String(row.cold_rent ?? ''), utilities: String(row.utilities ?? ''), deposit: String(row.deposit ?? ''),
      availFrom: row.avail_from ?? '', availTo: row.avail_to ?? '', openEnded: !!row.open_ended,
      minPeriod: row.min_period != null ? String(row.min_period) : '',
      maxPeriod: row.max_period != null ? String(row.max_period) : '',
      photos: photoRows.map((p, i) => ({
        r2Key: p.r2_key, position: p.position ?? i, isCover: !!p.is_cover,
        previewUrl: getSignedUrl(p.r2_key),
      })),
    }

    return NextResponse.json({ listing, formFields })
  }

  // CASA static listing
  if (!id.startsWith('partner-')) {
    const p = PROPERTIES.find(prop => prop.id === id)
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ listing: { ...p, source: 'casa' } })
  }

  // Partner listing — look up city from index
  const rawId = id.replace('partner-', '')
  const indexPath = path.join(CITIES_DIR, '_index.json')
  if (!fs.existsSync(indexPath)) {
    return NextResponse.json({ error: 'Partner index not found' }, { status: 500 })
  }

  const index: Record<string, string> = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  const citySlug = index[rawId]
  if (!citySlug) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cityFile = path.join(CITIES_DIR, `${citySlug}.json`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listings: any[] = JSON.parse(fs.readFileSync(cityFile, 'utf-8'))
  const listing = listings.find(l => String(l.id) === rawId)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ listing: mapPartnerDetail(listing) })
}

// PATCH /api/listings/[id]
// Two body shapes:
//  - { action: 'set_status', status }: ownership-checked status flip (Active/Rented toggle, Unpublish)
//  - flat form fields (same names as POST /api/listings): autosaves an in-progress draft, or edits an
//    existing listing without touching its status. Creates the row (status='draft') if it doesn't exist yet.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uid = await bearerUid(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [existing] = await d1Query<{ landlord_id: string; status: string }>(
    'SELECT landlord_id, status FROM listings WHERE id = ?', [id]
  )
  if (existing && existing.landlord_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  if (body.action === 'set_status') {
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const status = body.status
    // Landlord self-service is only ever a toggle between already-live states
    // (Active/Rented) or hiding a live listing (Unpublish) — the UI never
    // asks for anything else. Moderation approval (draft/pending_review ->
    // published) is deliberately not reachable through this endpoint: it
    // must go through the admin review flow, not a landlord's own token.
    const allowedNext: Record<string, string[]> = {
      published: ['rented', 'draft'],
      rented: ['published'],
    }
    if (!(allowedNext[existing.status] ?? []).includes(status)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
    }
    await d1Query('UPDATE listings SET status = ?, updated_at = ? WHERE id = ?', [status, Date.now(), id])
    return NextResponse.json({ ok: true })
  }

  const {
    ptype, title, streetName, houseNumber, city, postcode,
    bedrooms, bathrooms, roomSize, aptSize,
    amenities, desc, mates, numMates, mateGender, prefGender,
    rent, utilities, deposit,
    availFrom, availTo, openEnded,
    minPeriod, maxPeriod,
    photos,
  } = body

  const now = Date.now()

  if (!existing) {
    const street = [streetName?.trim(), houseNumber?.trim()].filter(Boolean).join(' ')
    try {
      await d1Query(
        `INSERT INTO listings (
          id, landlord_id, ptype, title, street, city, postcode,
          bedrooms, bathrooms, size_sqm, room_size_sqm,
          cold_rent, utilities, deposit,
          avail_from, avail_to, open_ended, min_period, max_period,
          description, mate_count, mate_gender, pref_gender, mate_notes,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
        [
          id, uid, ptype ?? 'studio', title?.trim() ?? '',
          street, city?.trim() ?? '', postcode?.trim() ?? '',
          bedrooms ?? 1, bathrooms ?? 1, aptSize ?? 50, roomSize ?? 15,
          parseInt(rent) || 0, parseInt(utilities) || 0, parseInt(deposit) || 0,
          availFrom || null, availTo || null, openEnded ? 1 : 0,
          minPeriod ? parseInt(minPeriod) : null, maxPeriod ? parseInt(maxPeriod) : null,
          desc?.trim() ?? '',
          numMates ?? 0, mateGender || null, prefGender || null, mates?.trim() || null,
          now, now,
        ]
      )
    } catch (err) {
      console.error('[PATCH /api/listings/[id]] create draft failed:', err)
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
    }
  } else {
    const sets: string[] = []
    const sqlParams: (string | number | null)[] = []
    const setCol = (col: string, val: string | number | null) => { sets.push(`${col} = ?`); sqlParams.push(val) }

    if (ptype !== undefined) setCol('ptype', ptype)
    if (title !== undefined) setCol('title', title.trim())
    if (streetName !== undefined || houseNumber !== undefined) {
      setCol('street', [streetName?.trim(), houseNumber?.trim()].filter(Boolean).join(' '))
    }
    if (city !== undefined) setCol('city', city.trim())
    if (postcode !== undefined) setCol('postcode', postcode.trim())
    if (bedrooms !== undefined) setCol('bedrooms', bedrooms)
    if (bathrooms !== undefined) setCol('bathrooms', bathrooms)
    if (roomSize !== undefined) setCol('room_size_sqm', roomSize)
    if (aptSize !== undefined) setCol('size_sqm', aptSize)
    if (rent !== undefined) setCol('cold_rent', parseInt(rent) || 0)
    if (utilities !== undefined) setCol('utilities', parseInt(utilities) || 0)
    if (deposit !== undefined) setCol('deposit', parseInt(deposit) || 0)
    if (availFrom !== undefined) setCol('avail_from', availFrom || null)
    if (availTo !== undefined) setCol('avail_to', availTo || null)
    if (openEnded !== undefined) setCol('open_ended', openEnded ? 1 : 0)
    if (minPeriod !== undefined) setCol('min_period', minPeriod ? parseInt(minPeriod) : null)
    if (maxPeriod !== undefined) setCol('max_period', maxPeriod ? parseInt(maxPeriod) : null)
    if (desc !== undefined) setCol('description', desc.trim())
    if (numMates !== undefined) setCol('mate_count', numMates)
    if (mateGender !== undefined) setCol('mate_gender', mateGender || null)
    if (prefGender !== undefined) setCol('pref_gender', prefGender || null)
    if (mates !== undefined) setCol('mate_notes', mates?.trim() || null)

    if (sets.length > 0) {
      sets.push('updated_at = ?')
      sqlParams.push(now, id)
      try {
        await d1Query(`UPDATE listings SET ${sets.join(', ')} WHERE id = ?`, sqlParams)
      } catch (err) {
        console.error('[PATCH /api/listings/[id]] update failed:', err)
        return NextResponse.json({ error: 'Failed to save changes' }, { status: 500 })
      }
    }
  }

  if (amenities !== undefined) {
    const selectedAmenities: string[] = Object.entries(amenities ?? {}).filter(([, v]) => v).map(([k]) => k)
    await d1Query('DELETE FROM listing_amenities WHERE listing_id = ?', [id])
    for (const amenity of selectedAmenities) {
      await d1Query('INSERT OR IGNORE INTO listing_amenities (listing_id, amenity) VALUES (?, ?)', [id, amenity])
    }
  }

  if (photos !== undefined) {
    const photoList: { r2Key: string; position: number; isCover: boolean }[] = Array.isArray(photos) ? photos : []
    await d1Query('DELETE FROM listing_photos WHERE listing_id = ?', [id])
    for (const photo of photoList) {
      await d1Query(
        `INSERT INTO listing_photos (id, listing_id, r2_key, position, is_cover) VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), id, photo.r2Key, photo.position, photo.isCover ? 1 : 0]
      )
    }
  }

  return NextResponse.json({ ok: true, listing_id: id })
}

// DELETE /api/listings/[id] — drafts only, ownership-checked
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const uid = await bearerUid(req)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [existing] = await d1Query<{ landlord_id: string; status: string }>(
    'SELECT landlord_id, status FROM listings WHERE id = ?', [id]
  )
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.landlord_id !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'Only drafts can be deleted' }, { status: 400 })
  }

  await d1Query('DELETE FROM messages WHERE inquiry_id IN (SELECT id FROM inquiries WHERE listing_id = ?)', [id])
  await d1Query('DELETE FROM inquiries WHERE listing_id = ?', [id])
  await d1Query('DELETE FROM listing_amenities WHERE listing_id = ?', [id])
  await d1Query('DELETE FROM listing_photos WHERE listing_id = ?', [id])
  await d1Query('DELETE FROM listings WHERE id = ?', [id])

  return NextResponse.json({ ok: true })
}
