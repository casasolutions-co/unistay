import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { d1Query } from '@/lib/d1'
import { getSignedUrl } from '@/lib/r2'
import { computeListingProgress } from '@/lib/listingProgress'

function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const min = 60_000, hr = 60 * min, day = 24 * hr, wk = 7 * day, mo = 30 * day
  if (diff < hr) return `${Math.max(1, Math.round(diff / min))} minutes ago`
  if (diff < day) return `${Math.round(diff / hr)} hours ago`
  if (diff < wk) return `${Math.round(diff / day)} days ago`
  if (diff < mo) return `${Math.round(diff / wk)} weeks ago`
  return `${Math.round(diff / mo)} months ago`
}

// GET /api/listings/mine — the current user's own listings, split into drafts/published
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let uid: string
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const rows = await d1Query<{
    id: string; ptype: string; title: string;
    street: string; city: string; postcode: string;
    cold_rent: number; utilities: number;
    avail_from: string | null; avail_to: string | null; open_ended: number;
    description: string; status: string;
    created_at: number; updated_at: number;
    cover_r2_key: string | null;
    amenity_count: number; photo_count: number; inquiry_count: number;
  }>(
    `SELECT l.id, l.ptype, l.title, l.street, l.city, l.postcode,
            l.cold_rent, l.utilities,
            l.avail_from, l.avail_to, l.open_ended,
            l.description, l.status,
            l.created_at, l.updated_at,
            (SELECT r2_key FROM listing_photos WHERE listing_id = l.id AND is_cover = 1 LIMIT 1) AS cover_r2_key,
            (SELECT COUNT(*) FROM listing_amenities WHERE listing_id = l.id) AS amenity_count,
            (SELECT COUNT(*) FROM listing_photos WHERE listing_id = l.id) AS photo_count,
            (SELECT COUNT(*) FROM inquiries WHERE listing_id = l.id) AS inquiry_count
     FROM listings l
     WHERE l.landlord_id = ? AND l.status != 'archived'
     ORDER BY l.updated_at DESC`,
    [uid]
  )

  const location = (street: string, city: string) =>
    street?.trim() && city?.trim() ? `${street}, ${city}` : (city?.trim() || 'No address yet')

  const drafts = rows
    .filter(r => r.status === 'draft')
    .map(r => {
      const { pct, step, of } = computeListingProgress({
        title: r.title, street: r.street, city: r.city, postcode: r.postcode,
        description: r.description, cold_rent: r.cold_rent,
        avail_from: r.avail_from, avail_to: r.avail_to, open_ended: r.open_ended,
        amenity_count: r.amenity_count, photo_count: r.photo_count,
      })
      return {
        id: r.id,
        title: r.title?.trim() || 'Untitled listing',
        location: location(r.street, r.city),
        pct, step, of,
        savedText: `Saved ${relativeTime(r.updated_at)}`,
      }
    })

  const published = rows
    .filter(r => r.status !== 'draft')
    .map(r => ({
      id: r.id,
      title: r.title?.trim() || 'Untitled listing',
      location: location(r.street, r.city),
      status: r.status, // 'pending_review' | 'published' | 'rented'
      rent: `€${r.cold_rent + r.utilities}`,
      applications: r.inquiry_count,
      publishedText: `Published ${relativeTime(r.created_at)}`,
      coverPhoto: r.cover_r2_key ? getSignedUrl(r.cover_r2_key) : null,
    }))

  return NextResponse.json({ drafts, published })
}
