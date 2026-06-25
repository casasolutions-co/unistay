'use client';

import { useState, useEffect } from 'react';
import { getRecentSearches, addRecentSearch, type RecentSearch } from './recentSearches';

export type SuggestionKind = 'recent' | 'city' | 'uni';
export type SuggestionItem = { name: string; sub: string; kind: SuggestionKind };
export type SuggestionGroup = { title: string; items: SuggestionItem[] };

const POPULAR_CITIES = [
  { name: 'Berlin', sub: 'Germany' },
  { name: 'Munich', sub: 'Germany' },
  { name: 'Hamburg', sub: 'Germany' },
  { name: 'Frankfurt am Main', sub: 'Germany' },
  { name: 'Köln', sub: 'Germany' },
  { name: 'Stuttgart', sub: 'Germany' },
];

const UNIS = [
  { name: 'Technical University of Munich', sub: 'Munich, Germany' },
  { name: 'Ludwig-Maximilians-Universität München', sub: 'Munich, Germany' },
  { name: 'University of Seville', sub: 'Seville, Spain' },
  { name: 'Sapienza Università di Roma', sub: 'Rome, Italy' },
  { name: 'University of Amsterdam', sub: 'Amsterdam, Netherlands' },
];

function buildGroups(
  query: string,
  allCities: { name: string; sub: string }[],
  recent: RecentSearch[],
): SuggestionGroup[] {
  const q = query.trim().toLowerCase();
  const hasQ = q.length > 0;
  const match = (it: { name: string; sub: string }) =>
    (it.name + ' ' + it.sub).toLowerCase().includes(q);

  const groups: SuggestionGroup[] = [];

  if (!hasQ && recent.length > 0) {
    groups.push({ title: 'Your recent searches', items: recent.map(it => ({ ...it, kind: 'recent' })) });
  }

  const cities = hasQ
    ? allCities.filter(match).slice(0, 8)
    : POPULAR_CITIES;
  if (cities.length) {
    groups.push({ title: hasQ ? 'Cities in Germany' : 'Popular cities', items: cities.map(it => ({ ...it, kind: 'city' })) });
  }

  const unis = UNIS.filter(match);
  if (unis.length) {
    groups.push({ title: 'Popular universities', items: unis.map(it => ({ ...it, kind: 'uni' })) });
  }

  return groups;
}

export function useCitySearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [allCities, setAllCities] = useState<{ name: string; sub: string }[]>([]);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setRecent(getRecentSearches());
    fetch('/api/cities')
      .then(r => r.json())
      .then((data: { slug: string; name: string }[]) =>
        setAllCities(data.map(c => ({ name: c.name, sub: 'Germany' })))
      )
      .catch(() => {});
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
