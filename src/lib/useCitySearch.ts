'use client';

import { useState, useEffect } from 'react';
import { getRecentSearches, addRecentSearch, type RecentSearch } from './recentSearches';

export type SuggestionKind = 'recent' | 'city' | 'uni';
export type SuggestionItem = { name: string; sub: string; kind: SuggestionKind };
export type SuggestionGroup = { title: string; items: SuggestionItem[] };

const POPULAR_CITIES = [
  { name: 'Berlin', sub: 'Germany' },
  { name: 'München', sub: 'Germany' },
  { name: 'Hamburg', sub: 'Germany' },
  { name: 'Frankfurt am Main', sub: 'Germany' },
  { name: 'Köln', sub: 'Germany' },
  { name: 'Stuttgart', sub: 'Germany' },
  { name: 'Düsseldorf', sub: 'Germany' },
  { name: 'Leipzig', sub: 'Germany' },
];

const UNIS = [
  { name: 'Technical University of Munich', sub: 'München, Germany' },
  { name: 'Ludwig-Maximilians-Universität München', sub: 'München, Germany' },
  { name: 'University of Seville', sub: 'Seville, Spain' },
  { name: 'Sapienza Università di Roma', sub: 'Rome, Italy' },
  { name: 'University of Amsterdam', sub: 'Amsterdam, Netherlands' },
];

// Normalise a city string for prefix matching:
// - expand common German abbreviations (i.d. → in der, b. → bei, OPf. → Oberpfalz …)
// - collapse hyphens/brackets to spaces so "Neu-Ulm" == "Neu Ulm"
function normaliseCity(s: string): string {
  return s
    .replace(/\bi\.d\.\s*/g, 'in der ')
    .replace(/\ba\.d\.\s*/g, 'an der ')
    .replace(/\bi\.\s*/g, 'im ')
    .replace(/\bv\.\s*/g, 'vor ')
    .replace(/\bb\.\s*/g, 'bei ')
    .replace(/\bNbg\./g, 'Nürnberg')
    .replace(/\bOPf\./g, 'Oberpfalz')
    .replace(/\bThür\./g, 'Thüringen')
    .replace(/\bSachs\./g, 'Sachsen')
    .replace(/\bObb\./g, 'Oberbayern')
    .replace(/\bBay\./g, 'Bayern')
    .replace(/\bSchw\./g, 'Schwaben')
    .replace(/\bWestf\./g, 'Westfalen')
    .replace(/\bRhld\./g, 'Rheinland')
    .replace(/[-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Module-level cache — fetched once, reused across all hook instances
let cachedCities: { name: string; sub: string; search: string }[] | null = null;
let fetchPromise: Promise<void> | null = null;

function loadCities(onLoad: (cities: { name: string; sub: string; search: string }[]) => void) {
  if (cachedCities) { onLoad(cachedCities); return; }
  if (!fetchPromise) {
    fetchPromise = fetch('/api/cities')
      .then(r => r.json())
      .then((data: { name: string }[]) => {
        cachedCities = data.map(c => ({
          name: c.name,
          sub: 'Germany',
          search: normaliseCity(c.name),
        }));
      })
      .catch(() => { fetchPromise = null; });
  }
  fetchPromise.then(() => { if (cachedCities) onLoad(cachedCities); });
}

function buildGroups(
  query: string,
  allCities: { name: string; sub: string; search: string }[],
  recent: RecentSearch[],
): SuggestionGroup[] {
  const q = normaliseCity(query.trim());
  const hasQ = q.length > 0;

  // Prefix match on the normalised form so "neu" only shows cities that START with "neu"
  const match = (it: { name: string; sub: string; search: string }) =>
    it.search.startsWith(q);

  const groups: SuggestionGroup[] = [];

  if (!hasQ && recent.length > 0) {
    groups.push({ title: 'Your recent searches', items: recent.map(it => ({ ...it, kind: 'recent' })) });
  }

  const cities = hasQ
    ? allCities.filter(match).slice(0, 10)
    : POPULAR_CITIES.map(c => ({ ...c, search: c.name.toLowerCase() }));
  if (cities.length) {
    groups.push({ title: hasQ ? 'Cities in Germany' : 'Popular cities', items: cities.map(it => ({ name: it.name, sub: it.sub, kind: 'city' as SuggestionKind })) });
  }

  const uniMatch = (it: { name: string; sub: string }) =>
    (it.name + ' ' + it.sub).toLowerCase().includes(q);
  const unis = UNIS.filter(uniMatch);
  if (unis.length) {
    groups.push({ title: 'Popular universities', items: unis.map(it => ({ ...it, kind: 'uni' as SuggestionKind })) });
  }

  return groups;
}

export function useCitySearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [allCities, setAllCities] = useState<{ name: string; sub: string; search: string }[]>(cachedCities ?? []);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage/cache on mount, not derivable during the server render
    setRecent(getRecentSearches());
    loadCities(setAllCities);
  }, []);

  const groups = buildGroups(query, allCities, recent);

  function selectCity(name: string, sub: string, kind: SuggestionKind) {
    if (kind !== 'recent') {
      addRecentSearch(name, sub);
      setRecent(getRecentSearches());
    }
  }

  return { query, setQuery, groups, selectCity };
}
