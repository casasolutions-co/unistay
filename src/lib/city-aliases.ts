// English/alt-spelling ↔ German city-name aliases, so a search for "Munich"
// finds listings filed under "München" and vice versa.
// Single source of truth — host/CASA search, partner search, and the
// autocomplete dropdown all read from this one list instead of keeping their
// own copies (which is how "Munich" ended up matching everywhere except
// partner listings).
const CITY_NAME_ALIASES: [alt: string, german: string][] = [
  ['munich', 'münchen'],
  ['cologne', 'köln'],
  ['nuremberg', 'nürnberg'],
  ['nuremburg', 'nürnberg'],
  ['nuernberg', 'nürnberg'],
  ['munster', 'münster'],
  ['muenster', 'münster'],
  ['dusseldorf', 'düsseldorf'],
  ['duesseldorf', 'düsseldorf'],
];

export function foldUmlauts(s: string): string {
  return s.toLowerCase()
    .replace(/ü/g, 'u').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ß/g, 'ss');
}

// ascii-folded alt → ascii-folded german, both directions.
const ALIAS_LOOKUP: Record<string, string> = {};
for (const [alt, de] of CITY_NAME_ALIASES) {
  ALIAS_LOOKUP[foldUmlauts(alt)] = foldUmlauts(de);
  ALIAS_LOOKUP[foldUmlauts(de)] = foldUmlauts(alt);
}

// Every ascii-folded form a city query should also match — e.g. "Munich" →
// ['munich', 'munchen']. Fold your own strings (city columns, list entries)
// with foldUmlauts before comparing against these.
export function cityMatchTerms(raw: string): string[] {
  const q = foldUmlauts(raw.trim());
  if (!q) return [];
  const alias = ALIAS_LOOKUP[q];
  return alias ? [q, alias] : [q];
}

// The native German spelling for a query, when it's a known alias — for
// callers that match against a city column verbatim (with umlauts) rather
// than an ascii-folded copy of it.
export function germanCityName(raw: string): string | null {
  const q = foldUmlauts(raw.trim());
  return CITY_NAME_ALIASES.find(([alt, de]) => foldUmlauts(alt) === q || foldUmlauts(de) === q)?.[1] ?? null;
}
