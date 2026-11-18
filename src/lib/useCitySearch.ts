'use client';

import { useState, useEffect } from 'react';
import { getRecentSearches, addRecentSearch, type RecentSearch } from './recentSearches';
import { foldUmlauts, cityMatchTerms } from './city-aliases';
import { usePlaceSearch, type Place } from './usePlaceSearch';

export type { Place };
export type SuggestionKind = 'recent' | 'city' | 'uni' | 'place';
// `place` is set for addresses/streets/neighbourhoods: search that place's
// city, nearest-first from its coordinates (see placeSearchParams).
export type SuggestionItem = { name: string; sub: string; kind: SuggestionKind; place?: Place };
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

// normaliseCity() only expands abbreviations; also fold umlauts so 'munchen'
// (ascii) and 'münchen' compare equal for prefix matching.
function searchKey(s: string): string {
  return foldUmlauts(normaliseCity(s));
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
          search: searchKey(c.name),
        }));
      })
      .catch(() => { fetchPromise = null; });
  }
  fetchPromise.then(() => { if (cachedCities) onLoad(cachedCities); });
}

const PLACE_SUB: Record<Place['kind'], string> = {
  address: 'Address', street: 'Street', area: 'Neighbourhood', city: 'City',
};

/** URL/API params for a search: a picked place searches its city, nearest-first. */
export function placeSearchParams(params: URLSearchParams, text: string, place: Place | null) {
  if (place) {
    params.set('city', place.city);
    params.set('near', `${place.lat.toFixed(5)},${place.lng.toFixed(5)}`);
    params.set('place', place.label);
  } else if (text.trim()) {
    params.set('city', text.trim());
  }
}

/** Inverse of placeSearchParams, for restoring a search from the URL. */
export function placeFromParams(sp: URLSearchParams): Place | null {
  const [lat, lng] = (sp.get('near') ?? '').split(',').map(Number);
  const label = sp.get('place');
  const city = sp.get('city');
  if (!label || !city || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label, kind: 'area', street: '', houseNumber: '', postcode: '', city, lat, lng };
}

function buildGroups(
  query: string,
  allCities: { name: string; sub: string; search: string }[],
  recent: RecentSearch[],
  places: Place[],
): SuggestionGroup[] {
  const q = searchKey(query);
  const hasQ = q.length > 0;

  // Prefix match on the normalised form so "neu" only shows cities that START with "neu".
  // cityMatchTerms also expands English/alt spellings ("munich" → "munchen") so
  // those match the German city list too.
  const terms = cityMatchTerms(q);
  const match = (it: { name: string; sub: string; search: string }) =>
    terms.some(t => it.search.startsWith(t));

  const groups: SuggestionGroup[] = [];

  if (!hasQ && recent.length > 0) {
    groups.push({ title: 'Your recent searches', items: recent.map(it => ({ ...it, kind: 'recent' })) });
  }

  const cities = hasQ
    ? allCities.filter(match).slice(0, places.length ? 4 : 10)
    : POPULAR_CITIES.map(c => ({ ...c, search: c.name.toLowerCase() }));
  if (cities.length) {
    groups.push({ title: hasQ ? 'Cities in Germany' : 'Popular cities', items: cities.map(it => ({ name: it.name, sub: it.sub, kind: 'city' as SuggestionKind })) });
  }

  // Cities are already covered by the list above.
  const placeItems = places.filter(p => p.kind !== 'city');
  if (hasQ && placeItems.length) {
    groups.push({
      title: 'Addresses & neighbourhoods',
      items: placeItems.map(p => ({ name: p.label, sub: PLACE_SUB[p.kind], kind: 'place' as SuggestionKind, place: p })),
    });
  }

  const uniMatch = (it: { name: string; sub: string }) =>
    !hasQ || terms.some(t => foldUmlauts(it.name + ' ' + it.sub).includes(t));
  const unis = UNIS.filter(uniMatch);
  if (unis.length) {
    groups.push({ title: 'Popular universities', items: unis.map(it => ({ ...it, kind: 'uni' as SuggestionKind })) });
  }

  return groups;
}

export function useCitySearch(initialQuery = '', initialPlace: Place | null = null, withPlaces = true) {
  const [query, setQuery] = useState(initialPlace?.label ?? initialQuery);
  const [place, setPlace] = useState<Place | null>(initialPlace);
  const [allCities, setAllCities] = useState<{ name: string; sub: string; search: string }[]>(cachedCities ?? []);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage/cache on mount, not derivable during the server render
    setRecent(getRecentSearches());
    loadCities(setAllCities);
  }, []);

  // Don't look up places for the text of a place the user already picked.
  const places = usePlaceSearch(query, 'any', withPlaces && query !== place?.label);
  const groups = buildGroups(query, allCities, recent, places);

  function selectCity(name: string, sub: string, kind: SuggestionKind, picked?: Place) {
    setPlace(picked ?? null);
    if (kind !== 'recent') {
      addRecentSearch(name, sub, picked);
      setRecent(getRecentSearches());
    }
  }

  /** The picked place, if `text` is still exactly its label (i.e. not edited since). */
  const placeFor = (text: string) => (place && place.label === text ? place : null);

  return { query, setQuery, groups, selectCity, placeFor };
}
