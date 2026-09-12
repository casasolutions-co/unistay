import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { putPhoto } from '@/lib/r2'

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB per photo
const LISTING_ID_RE = /^[A-Za-z0-9_-]+$/

// Client-declared file.type is just a form field — sniff the real magic bytes
// so a renamed/relabeled file can't slip past the allowlist.
function sniffImageType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp') return 'image/heic'
  return null
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const listingId = formData.get('listingId') as string | null

  if (!file || !listingId) {
    return NextResponse.json({ error: 'file and listingId required' }, { status: 400 })
  }
  if (!LISTING_ID_RE.test(listingId)) {
    return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Photo must be under 10 MB' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const sniffedType = sniffImageType(buffer)
  if (!sniffedType) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP and HEIC images are allowed' }, { status: 400 })
  }

  const r2Key = `listings/${listingId}/${crypto.randomUUID()}.${EXT_BY_TYPE[sniffedType]}`

  try {
    await putPhoto(r2Key, buffer, sniffedType)
  } catch (err) {
    console.error('[POST /api/casa-photos]', err)
    return NextResponse.json({ error: 'Upload to storage failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ r2Key })
}
