import { NextRequest, NextResponse } from 'next/server'
import { searchPlaces } from '@/lib/places'

// Address/place autocomplete — see src/lib/places.ts.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  return NextResponse.json(await searchPlaces(sp.get('q') ?? '', sp.get('mode')))
}
