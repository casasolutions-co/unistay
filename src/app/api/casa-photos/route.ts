import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { putPhoto } from '@/lib/r2'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB per photo

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
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP and HEIC images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Photo must be under 10 MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const r2Key = `listings/${listingId}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await putPhoto(r2Key, buffer, file.type)
  } catch (err) {
    console.error('[POST /api/casa-photos]', err)
    return NextResponse.json({ error: 'Upload to storage failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ r2Key })
}
