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
  // Partner listings filed under a district the city picker doesn't list.
  ['münchingen', 'korntal-münchingen'],
  ['friedrichstal', 'stutensee'],
  ['ifta', 'werra-suhl-tal'],
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

// Every spelling of a city as stored somewhere (lowercased, umlauts kept) —
// e.g. "München" → ['münchen', 'munich']. For callers matching a city column
// verbatim: partner listings store HousingAnywhere's English names ("Munich"),
// so a German-only lookup found nothing for either spelling.
export function cityNameVariants(raw: string): string[] {
  const q = raw.trim().toLowerCase()
  if (!q) return []
  const f = foldUmlauts(q)
  const out = new Set([q])
  for (const [alt, de] of CITY_NAME_ALIASES) {
    if (foldUmlauts(alt) === f || foldUmlauts(de) === f) { out.add(alt); out.add(de) }
  }
  return [...out]
}

// Normalise a city string for prefix matching:
// - expand common German abbreviations (i.d. → in der, b. → bei, OPf. → Oberpfalz …)
// - collapse hyphens/brackets to spaces so "Neu-Ulm" == "Neu Ulm"
export function normaliseCity(s: string): string {
  return s
    .replace(/\bi\.d\.\s*/g, 'in der ')
    .replace(/\bv\.d\.\s*/g, 'vor der ')
    .replace(/\ba\.d\.\s*/g, 'an der ')
    .replace(/\ba\.\s*/g, 'am ')
    .replace(/\bSt\.\s*/g, 'Sankt ')
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
    .replace(/[-()/,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Which of `cities` (names as stored on listings) a search for `query` should
// return. Sources spell the same town differently — the picker list says
// "Offenbach am Main" / "Garching b.München" / "St. Ingbert", partner data says
// "Offenbach" / "Garching bei München" / "Sankt Ingbert", plus English names
// ("Munich"). So compare normalised forms: a stored city matches when it starts
// with the query ("frank" → "Frankfurt am Main") or the query is the stored
// name plus a qualifier ("Offenbach am Main" → "Offenbach").
// ponytail: a qualifier-less stored name also matches namesakes ("Offenbach an
// der Queich" → "Offenbach"); add a per-city map if that ever matters.
export function citiesMatching(query: string, cities: string[]): string[] {
  // Raw query too: cityNameVariants lowercases, which defeats the case-sensitive
  // abbreviation expansion ("St.", "Rhld.").
  const qs = [query, ...cityNameVariants(query)].map(cityKey).filter(Boolean)
  return cities.filter(c => {
    const a = cityKey(c)
    return !!a && qs.some(b => a.startsWith(b) || b.startsWith(a + ' '))
  })
}

function cityKey(s: string): string {
  return foldUmlauts(normaliseCity(s)).replace(/^verbandsgemeinde /, '')
}
