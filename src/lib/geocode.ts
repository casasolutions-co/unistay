/**
 * Geocodes a street address to lat/lng using Nominatim (OpenStreetMap).
 * Returns null if the address can't be resolved.
 * Must only be called server-side (API routes).
 */

// Nominatim's usage policy caps free use at ~1 req/sec and requires caching
// results instead of re-geocoding the same address. A real street address
// never moves, so cache indefinitely and serialize requests through one
// queue so a burst of listing submissions can't fan out past the cap.
// ponytail: process-local (each serverless instance has its own cache/queue,
// so the 1 req/sec limit is per-instance, not global) — good enough for
// current traffic; move to a shared cache/queue (or Mapbox, already
// provisioned) if launch volume makes that a problem.
const cache = new Map<string, { lat: number; lng: number } | null>();
const MIN_INTERVAL_MS = 1100;
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

export async function geocodeAddress(
  streetName: string,
  houseNumber: string,
  city: string,
  postcode: string,
  country = 'Germany'
): Promise<{ lat: number; lng: number } | null> {
  // Nominatim structured street param format: "housenumber streetname"
  const street = houseNumber.trim()
    ? `${houseNumber.trim()} ${streetName.trim()}`
    : streetName.trim();

  const cacheKey = `${street}|${city}|${postcode}|${country}`.toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const result = await (queue = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fetchFromNominatim(street, city, postcode, country);
  })) as { lat: number; lng: number } | null;

  cache.set(cacheKey, result);
  return result;
}

async function fetchFromNominatim(
  street: string,
  city: string,
  postcode: string,
  country: string
): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({
    street,
    city,
    postalcode: postcode,
    country,
    format: 'json',
    limit: '1',
    countrycodes: 'de',
  });
  const url = `https://nominatim.openstreetmap.org/search?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'UniStay/1.0 (contact@unistay.de)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const results = await res.json() as { lat: string; lon: string }[];
    if (!results[0]) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null;
  }
}
