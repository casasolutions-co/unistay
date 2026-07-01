import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PROPERTIES } from '@/app/data/properties'
import { ICON_PATHS } from '@/app/data/properties'
import { d1Query } from '@/lib/d1'
import { getSignedUrl } from '@/lib/r2'
import { cityCoords } from '@/lib/city-coords'

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
  _req: NextRequest,
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

    return NextResponse.json({ listing })
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
