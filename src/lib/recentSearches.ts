const KEY = 'us_recent_searches'
const MAX = 5

export type RecentSearch = { name: string; sub: string }

export function getRecentSearches(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function addRecentSearch(name: string, sub = 'Germany') {
  const prev = getRecentSearches().filter(r => r.name.toLowerCase() !== name.toLowerCase())
  const next = [{ name, sub }, ...prev].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
}
