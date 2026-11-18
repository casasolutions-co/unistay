// Search-as-you-type address/place lookup for Germany.
// Provider: Mapbox Geocoding v6 when MAPBOX_TOKEN is set; otherwise Photon
// (komoot's free OSM geocoder) so local dev works without a key.
// Results are "temporary" in Mapbox terms — shown to the user, not stored by us.
// ponytail: no cache / rate limit — clients debounce 250ms; add an LRU here
// if request volume or the Mapbox bill becomes a problem.

export type Place = {
  label: string        // "Leopoldstraße 12, 80802 München"
  kind: 'address' | 'street' | 'area' | 'city'
  street: string
  houseNumber: string
  postcode: string
  city: string
  lat: number
  lng: number
}

type Mode = 'address' | 'any'

export async function searchPlaces(q: string, mode: string | null): Promise<Place[]> {
  q = q.trim()
  if (q.length < 3 || q.length > 200) return []
  // Listing form needs a real street address; search accepts anything.
  const m: Mode = mode === 'address' ? 'address' : 'any'
  try {
    const raw = process.env.MAPBOX_TOKEN ? await fromMapbox(q, m, process.env.MAPBOX_TOKEN) : await fromPhoton(q, m)
    const seen = new Set<string>()
    return raw.filter((p): p is Place => !!p && !seen.has(p.label) && !!seen.add(p.label)).slice(0, 6)
  } catch {
    return []
  }
}

function makePlace(
  kind: Place['kind'], name: string, street: string, houseNumber: string,
  postcode: string, city: string, lat: number, lng: number,
): Place | null {
  if (!city || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (kind === 'address' && !street) return null
  const head =
    kind === 'address' ? `${street} ${houseNumber}`.trim()
    : kind === 'street' ? street
    : kind === 'area' ? name
    : ''
  const tail = [kind === 'address' || kind === 'street' ? postcode : '', city].filter(Boolean).join(' ')
  return { label: head ? `${head}, ${tail}` : tail, kind, street, houseNumber, postcode, city, lat, lng }
}

/* ── Mapbox Geocoding v6 ─────────────────────────────────────── */

const MAPBOX_TYPES: Record<Mode, string> = {
  address: 'address,street',
  any: 'address,street,neighborhood,locality,place',
}

async function fromMapbox(q: string, mode: Mode, token: string) {
  const params = new URLSearchParams({
    q, access_token: token, country: 'de', language: 'de',
    types: MAPBOX_TYPES[mode], autocomplete: 'true', limit: '8',
  })
  const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, {
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) {
    console.error('[places] mapbox', res.status, await res.text().catch(() => ''))
    return []
  }
  type Ctx = { name?: string; address_number?: string; street_name?: string }
  const data = await res.json() as {
    features: { properties: {
      feature_type: string; name: string
      coordinates: { latitude: number; longitude: number }
      context?: Record<string, Ctx | undefined>
    } }[]
  }
  return data.features.map(({ properties: p }) => {
    const c = p.context ?? {}
    const kind: Place['kind'] =
      p.feature_type === 'address' ? 'address'
      : p.feature_type === 'street' ? 'street'
      : p.feature_type === 'place' ? 'city'
      : 'area'
    const street = c.address?.street_name ?? c.street?.name ?? (kind === 'street' ? p.name : '')
    const city = c.place?.name ?? (kind === 'city' ? p.name : '')
    return makePlace(kind, p.name, street, c.address?.address_number ?? '',
      c.postcode?.name ?? '', city, p.coordinates.latitude, p.coordinates.longitude)
  })
}

/* ── Photon (fallback, no key) ───────────────────────────────── */

const PHOTON_LAYERS: Record<Mode, string[]> = {
  address: ['house', 'street'],
  any: ['house', 'street', 'locality', 'district', 'city'],
}

async function fromPhoton(q: string, mode: Mode) {
  const params = new URLSearchParams({ q, limit: '8', lang: 'de', bbox: '5.87,47.27,15.04,55.06' })
  for (const l of PHOTON_LAYERS[mode]) params.append('layer', l)
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { 'User-Agent': 'UniStay/1.0 (contact@unistay.de)' },
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) return []
  const data = await res.json() as {
    features: { properties: Record<string, string | undefined>; geometry: { coordinates: [number, number] } }[]
  }
  return data.features.map(({ properties: p, geometry: { coordinates: [lng, lat] } }) => {
    if (p.countrycode !== 'DE') return null
    const kind: Place['kind'] =
      p.type === 'house' ? 'address'
      : p.type === 'street' ? 'street'
      : p.type === 'city' ? 'city'
      : 'area'
    // A "house" hit can be a shop/hotel at that address — label it by the address, not the business name.
    const street = (kind === 'street' ? p.name : p.street) ?? ''
    const city = p.city ?? (kind === 'city' ? p.name : '') ?? ''
    return makePlace(kind, p.name ?? '', street, kind === 'address' ? (p.housenumber ?? '') : '',
      p.postcode ?? '', city, lat, lng)
  })
}
