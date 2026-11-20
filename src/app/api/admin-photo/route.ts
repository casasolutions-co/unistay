import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'
import heicConvert from 'heic-convert'
import { getPhoto, putPhoto } from '@/lib/r2'
import { shrinkPhoto } from '@/lib/shrink-photo'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const key = req.nextUrl.searchParams.get('key')
  if (!key) return new NextResponse('Missing key', { status: 400 })

  // Only the object namespaces the admin UI actually renders — listing photos,
  // user-uploaded documents and profile photos. Prevents this authenticated proxy from being used to
  // read arbitrary objects in the bucket, and blocks path traversal in the key.
  if (key.includes('..') || !/^(listings|documents|avatars)\/[A-Za-z0-9._/-]+$/.test(key)) {
    return new NextResponse('Invalid key', { status: 400 })
  }

  const photo = await getPhoto(key)
  if (!photo) return new NextResponse('Not found', { status: 404 })

  // Photos uploaded before the HEIC converter existed are stored as HEIC, which browsers
  // can't show. Convert once and overwrite the object in place (same key), so the next
  // read — here or in the student app — gets the JPEG.
  if (photo.contentType === 'image/heic') {
    try {
      const jpeg = await shrinkPhoto(Buffer.from(await heicConvert({ buffer: Buffer.from(photo.body), format: 'JPEG', quality: 0.9 })))
      await putPhoto(key, jpeg, 'image/jpeg')
      photo.body = jpeg
      photo.contentType = 'image/jpeg'
    } catch (err) {
      console.error('[GET /api/admin-photo] HEIC conversion failed', key, err)
    }
  }

  return new NextResponse(Buffer.from(photo.body), {
    headers: {
      'Content-Type': photo.contentType,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
