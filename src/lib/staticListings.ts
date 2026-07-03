// CASA (admin-curated legacy) and PARTNER (HousingAnywhere) listings are static
// data with no D1 row by design — see reference/html_files/backend.md §3 and
// ADMIN_PANEL_PLAN.md §3: "CASA... static, no DB row, no status... never enter
// the moderation queue." The full catalog lives in new_unistay's
// src/app/data/properties.ts; this is a trimmed display-only mirror (just the
// fields the admin messages view needs) so conversations about these listings
// can still show a real title/city/price instead of a bare listing id.
export interface StaticListing {
  id: string
  title: string
  city: string
  coldRent: number
  badge: 'CASA' | 'PARTNER'
}

export const STATIC_LISTINGS: StaticListing[] = [
  { id: 'munich-1', title: 'One bedroom free in Munich',            city: 'Munich', coldRent: 400,  badge: 'CASA' },
  { id: 'munich-2', title: 'Studio near TU Munich',                 city: 'Munich', coldRent: 800,  badge: 'CASA' },
  { id: 'munich-3', title: '3-Room Apartment – Schwabing',           city: 'Munich', coldRent: 1500, badge: 'CASA' },
  { id: 'munich-4', title: 'Private Room – Maxvorstadt',             city: 'Munich', coldRent: 600,  badge: 'CASA' },
  { id: 'munich-5', title: 'Apartment – Munich Neuhausen',           city: 'Munich', coldRent: 1150, badge: 'CASA' },
  { id: 'munich-6', title: 'Bright Studio – Sendling',               city: 'Munich', coldRent: 730,  badge: 'PARTNER' },
  { id: 'munich-7', title: 'Shared flat – Haidhausen',               city: 'Munich', coldRent: 540,  badge: 'CASA' },
  { id: 'munich-8', title: '4-Room family flat – Bogenhausen',       city: 'Munich', coldRent: 2000, badge: 'PARTNER' },
]

const BY_ID = new Map(STATIC_LISTINGS.map(l => [l.id, l]))

export function findStaticListing(listingId: string): StaticListing | undefined {
  return BY_ID.get(listingId)
}
