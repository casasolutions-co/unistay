import { d1Query } from '../d1'
import { citiesMatching } from '../city-aliases'

/**
 * Stored city names in `table` that a search for `query` should return (see
 * citiesMatching). Callers filter with `city IN (...)`; an empty result means
 * nothing matches. Runs only on a listings-cache miss, and the DISTINCT is
 * index-only, so no extra caching here.
 */
export async function matchingCities(table: 'listings' | 'partner_listings', query: string): Promise<string[]> {
  const rows = await d1Query<{ city: string }>(`SELECT DISTINCT city FROM ${table} WHERE city IS NOT NULL`)
  // D1 caps bound parameters at 100; only a 1–2 letter query gets near that.
  return citiesMatching(query, rows.map(r => r.city)).slice(0, 90)
}

export const inList = (n: number) => `(${Array(n).fill('?').join(', ')})`
