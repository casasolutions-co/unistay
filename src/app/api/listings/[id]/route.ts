import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PROPERTIES } from '@/app/data/properties'
import { ICON_PATHS } from '@/app/data/properties'

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
    rating: l.rating ?? null,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // CASA listing
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
