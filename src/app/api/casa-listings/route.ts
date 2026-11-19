import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { createCasaListing, updateListing, getListingForEdit, _writeAudit, type CasaListingInput } from '@/lib/data'

// Shared validation for create (POST) and admin edit (PUT). Returns an error string or the input.
function parseListing(body: Record<string, unknown>): string | CasaListingInput {
  const b = body as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    ptype, title, streetName, houseNumber, city, postcode,
    bedrooms, bathrooms, roomSize, aptSize,
    amenities,
    desc, mates, numMates, mateGender, prefGender,
    rent, utilities, deposit, adminFee,
    availFrom, availTo, openEnded,
    minPeriod, maxPeriod,
    photos,
  } = b

  if (!title?.trim()) return 'title required'
  if (!streetName?.trim() || !city?.trim() || !postcode?.trim()) return 'full address required'
  if (!String(rent ?? '').trim()) return 'rent required'

  return {
    ptype: ptype ?? 'studio',
    title: title.trim(),
    street: [streetName?.trim(), houseNumber?.trim()].filter(Boolean).join(' '),
    city: city.trim(), postcode: postcode.trim(),
    bedrooms: bedrooms ?? 1, bathrooms: bathrooms ?? 1,
    aptSize: aptSize ?? 50, roomSize: roomSize ?? 15,
    rent: parseInt(rent) || 0, utilities: parseInt(utilities) || 0, deposit: parseInt(deposit) || 0,
    adminFee: Math.max(0, parseInt(adminFee) || 0),
    availFrom: availFrom || null, availTo: availTo || null, openEnded: !!openEnded,
    minPeriod: minPeriod ? parseInt(minPeriod) : null, maxPeriod: maxPeriod ? parseInt(maxPeriod) : null,
    desc: desc?.trim() ?? '',
    mateCount: numMates ?? 0, mateGender: mateGender || null, prefGender: prefGender || null, mateNotes: mates?.trim() || null,
    amenities: Object.entries(amenities ?? {}).filter(([, v]) => v).map(([k]) => k),
    photos: Array.isArray(photos) ? photos : [],
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const input = parseListing(body)
  if (typeof input === 'string') return NextResponse.json({ error: input }, { status: 400 })

  try {
    const id = await createCasaListing({ ...input, id: typeof body.listingId === 'string' ? body.listingId : undefined })
    await _writeAudit(session.email, 'listing.casa_create', 'listing', id)
    return NextResponse.json({ listing_id: id })
  } catch (err) {
    console.error('[POST /api/casa-listings]', err)
    return NextResponse.json({ error: 'Failed to save listing. Please try again.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const id = typeof body.listingId === 'string' ? body.listingId : ''
  if (!id || !(await getListingForEdit(id))) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  const input = parseListing(body)
  if (typeof input === 'string') return NextResponse.json({ error: input }, { status: 400 })

  try {
    await updateListing(id, input)
    await _writeAudit(session.email, 'listing.edit', 'listing', id)
    return NextResponse.json({ listing_id: id })
  } catch (err) {
    console.error('[PUT /api/casa-listings]', err)
    return NextResponse.json({ error: 'Failed to save changes. Please try again.' }, { status: 500 })
  }
}
