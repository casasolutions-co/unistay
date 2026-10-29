import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { getPhoto } from '@/lib/r2'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const key = req.nextUrl.searchParams.get('key')
  if (!key) return new NextResponse('Missing key', { status: 400 })

  // Only the object namespaces the admin UI actually renders — listing photos and
  // user-uploaded documents. Prevents this authenticated proxy from being used to
  // read arbitrary objects in the bucket, and blocks path traversal in the key.
  if (key.includes('..') || !/^(listings|documents)\/[A-Za-z0-9._/-]+$/.test(key)) {
    return new NextResponse('Invalid key', { status: 400 })
  }

  const photo = await getPhoto(key)
  if (!photo) return new NextResponse('Not found', { status: 404 })

  return new NextResponse(Buffer.from(photo.body), {
    headers: {
      'Content-Type': photo.contentType,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
