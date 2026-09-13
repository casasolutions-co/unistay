// Session-scoped cache of /api/listings responses, keyed by the exact query
// string. Flipping a filter back and forth, or using browser back/forward,
// re-renders the same search within seconds — this skips the repeat network
// round-trip (and whatever it would've cost the API/DB) for that case.
const PREFIX = 'unistay:search:';
const TTL_MS = 60_000;

// ponytail: sessionStorage entries expire on read (TTL check below) but are
// never proactively swept, so a long tab session accumulates stale keys.
// Upgrade to an LRU cap if that ever shows up as real storage pressure.
export function getCachedSearch<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw) as { data: T; savedAt: number };
    return Date.now() - savedAt > TTL_MS ? null : data;
  } catch {
    return null;
  }
}

export function setCachedSearch<T>(key: string, data: T) {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // sessionStorage full or unavailable (private mode) — caching is a nice-to-have
  }
}
