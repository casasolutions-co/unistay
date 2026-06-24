import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const raw = JSON.parse(readFileSync(join(root, 'src/lib/CASASolutions.json'), 'utf-8'))
const outDir = join(root, 'public/partner-cities')
mkdirSync(outDir, { recursive: true })

const byCity = {}
for (const listing of raw.listings) {
  const city = listing.location.city
  if (!byCity[city]) byCity[city] = []
  byCity[city].push(listing)
}

const index = {}
for (const [city, listings] of Object.entries(byCity)) {
  const slug = city.toLowerCase().replace(/[/\\]/g, '-').replace(/\s+/g, '-')
  writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(listings))
  for (const l of listings) index[l.id] = slug
  console.log(`${city}: ${listings.length} listings → ${slug}.json`)
}

writeFileSync(join(outDir, '_index.json'), JSON.stringify(index))
console.log(`\nDone. ${Object.keys(byCity).length} cities split. Index: ${Object.keys(index).length} entries.`)
