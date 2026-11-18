const KEY = 'us_recent_searches'
const MAX = 5

import type { Place } from '@/lib/places'

export type RecentSearch = { name: string; sub: string; place?: Place }

export function getRecentSearches(): RecentSearch[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function addRecentSearch(name: string, sub = 'Germany', place?: Place) {
  const prev = getRecentSearches().filter(r => r.name.toLowerCase() !== name.toLowerCase())
  const next = [{ name, sub, place }, ...prev].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
}
