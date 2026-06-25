import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Capitalize each dash-separated segment, preserving umlauts/special chars
function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

let cachedCities: { slug: string; name: string }[] | null = null

export async function GET() {
  if (!cachedCities) {
    const dir = path.join(process.cwd(), 'public', 'partner-cities')
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('_'))
    cachedCities = files.map(f => ({
      slug: f.slice(0, -5),
      name: slugToName(f.slice(0, -5)),
    }))
  }
  return NextResponse.json(cachedCities)
}
