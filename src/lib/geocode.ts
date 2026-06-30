/**
 * Geocodes a street address to lat/lng using Nominatim (OpenStreetMap).
 * Returns null if the address can't be resolved.
 * Must only be called server-side (API routes).
 */
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
