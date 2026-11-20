// "Search this area" map bounds: [south, west, north, east], shared by the
// search page (URL + button) and /api/listings (filter). The span cap keeps an
// area search to roughly a metro region; zoomed out further, the button asks
// the user to zoom in instead.
export type Bbox = [south: number, west: number, north: number, east: number]

export const MAX_LAT_SPAN = 1.5
export const MAX_LNG_SPAN = 2.5

export function areaTooBig([s, w, n, e]: Bbox): boolean {
  return n - s > MAX_LAT_SPAN || e - w > MAX_LNG_SPAN
}

/** Valid, not-too-big bbox from a `s,w,n,e` string, else null. */
export function parseBbox(raw: string | null | undefined): Bbox | null {
  const b = (raw ?? '').split(',').map(Number)
  if (b.length !== 4 || !b.every(Number.isFinite)) return null
  const [s, w, n, e] = b
  if (s >= n || w >= e || s < -90 || n > 90 || w < -180 || e > 180) return null
  return areaTooBig([s, w, n, e]) ? null : [s, w, n, e]
}

export const bboxParam = (b: Bbox) => b.map(v => v.toFixed(4)).join(',')

export const bboxCenter = ([s, w, n, e]: Bbox): [number, number] => [(s + n) / 2, (w + e) / 2]
