import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

// revalidateTag needs Next's own request-scoped store (see revalidate.js in
// next/dist) — calling it from netlify/functions/sync-partner-listings-background.ts
// directly throws ("static generation store missing"), since that's a
// separate Netlify Function outside the Next.js runtime. This route exists so
// that background job can trigger invalidation over HTTP instead, the pattern
// Next's own docs recommend for exactly this case (see revalidateTag.md:
// "webhooks or third-party services that need immediate expiration").
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  revalidateTag('listings', 'max')
  return NextResponse.json({ revalidated: true })
}
