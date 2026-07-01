import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { createCasaListing, _writeAudit } from '@/lib/data'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    ptype, title, streetName, houseNumber, city, postcode,
    bedrooms, bathrooms, roomSize, aptSize,
    amenities,
    desc, mates, numMates, mateGender, prefGender,
    rent, utilities, deposit,
    availFrom, availTo, openEnded,
    minPeriod, maxPeriod,
    photos,
  } = body

  const street = [streetName?.trim(), houseNumber?.trim()].filter(Boolean).join(' ')

  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!streetName?.trim() || !city?.trim() || !postcode?.trim())
    return NextResponse.json({ error: 'full address required' }, { status: 400 })
  if (!rent?.trim()) return NextResponse.json({ error: 'rent required' }, { status: 400 })

  const selectedAmenities: string[] = Object.entries(amenities ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k)

  const photoList: { r2Key: string; position: number; isCover: boolean }[] =
    Array.isArray(photos) ? photos : []

  try {
    const id = await createCasaListing({
      id: typeof body.listingId === 'string' ? body.listingId : undefined,
      ptype: ptype ?? 'studio',
      title: title.trim(),
      street, city: city.trim(), postcode: postcode.trim(),
      bedrooms: bedrooms ?? 1, bathrooms: bathrooms ?? 1,
      aptSize: aptSize ?? 50, roomSize: roomSize ?? 15,
      rent: parseInt(rent) || 0, utilities: parseInt(utilities) || 0, deposit: parseInt(deposit) || 0,
      availFrom: availFrom || null, availTo: availTo || null, openEnded: !!openEnded,
      minPeriod: minPeriod ? parseInt(minPeriod) : null, maxPeriod: maxPeriod ? parseInt(maxPeriod) : null,
      desc: desc?.trim() ?? '',
      mateCount: numMates ?? 0, mateGender: mateGender || null, prefGender: prefGender || null, mateNotes: mates?.trim() || null,
      amenities: selectedAmenities,
      photos: photoList,
    })

    // Audit log is best-effort — admin_audit_log.admin_id FK-references users(id),
    // and an admin session's email/uid isn't necessarily a row in `users`, so don't
    // let a failed audit write undo an already-persisted listing.
    try {
      await _writeAudit(session.email, 'listing.casa_create', 'listing', id)
    } catch (err) {
      console.error('[POST /api/casa-listings] audit log write failed:', err)
    }

    return NextResponse.json({ listing_id: id })
  } catch (err) {
    console.error('[POST /api/casa-listings]', err)
    return NextResponse.json({ error: 'Failed to save listing. Please try again.' }, { status: 500 })
  }
}
