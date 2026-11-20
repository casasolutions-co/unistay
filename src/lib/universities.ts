// Universities searchable from the hero/search box. Picking (or typing) one
// searches its city nearest-first from the main campus, like a picked address.
// `city` must be the spelling listings use (see city-aliases for English names).
// ponytail: hand-kept list, main-campus coords only; move to a DB table if
// admins need to add unis or multi-campus unis need per-campus search.
import { foldUmlauts } from './city-aliases'
import type { Place } from './places'

export type University = { name: string; aka: string[]; city: string; lat: number; lng: number }

export const UNIVERSITIES: University[] = [
  { name: 'Technische Universität München', aka: ['TUM', 'Technical University of Munich', 'TU München'], city: 'München', lat: 48.1497, lng: 11.5679 },
  { name: 'Ludwig-Maximilians-Universität München', aka: ['LMU', 'University of Munich'], city: 'München', lat: 48.1508, lng: 11.5803 },
  { name: 'Hochschule München', aka: ['HM', 'Munich University of Applied Sciences'], city: 'München', lat: 48.1543, lng: 11.5550 },
  { name: 'Humboldt-Universität zu Berlin', aka: ['HU Berlin', 'Humboldt University'], city: 'Berlin', lat: 52.5179, lng: 13.3936 },
  { name: 'Freie Universität Berlin', aka: ['FU Berlin', 'Free University of Berlin'], city: 'Berlin', lat: 52.4482, lng: 13.2867 },
  { name: 'Technische Universität Berlin', aka: ['TU Berlin', 'Technical University of Berlin'], city: 'Berlin', lat: 52.5125, lng: 13.3269 },
  { name: 'Universität Hamburg', aka: ['UHH', 'University of Hamburg'], city: 'Hamburg', lat: 53.5667, lng: 9.9847 },
  { name: 'Goethe-Universität Frankfurt', aka: ['Goethe University Frankfurt'], city: 'Frankfurt am Main', lat: 50.1263, lng: 8.6668 },
  { name: 'Universität zu Köln', aka: ['University of Cologne', 'Uni Köln'], city: 'Köln', lat: 50.9282, lng: 6.9286 },
  { name: 'Universität Stuttgart', aka: ['University of Stuttgart', 'Uni Stuttgart'], city: 'Stuttgart', lat: 48.7453, lng: 9.1060 },
  { name: 'Heinrich-Heine-Universität Düsseldorf', aka: ['HHU', 'University of Düsseldorf'], city: 'Düsseldorf', lat: 51.1904, lng: 6.7942 },
  { name: 'Universität Leipzig', aka: ['Leipzig University'], city: 'Leipzig', lat: 51.3389, lng: 12.3794 },
  { name: 'Technische Universität Dresden', aka: ['TU Dresden', 'TUD'], city: 'Dresden', lat: 51.0285, lng: 13.7263 },
  { name: 'RWTH Aachen', aka: ['RWTH Aachen University'], city: 'Aachen', lat: 50.7779, lng: 6.0778 },
  { name: 'Karlsruher Institut für Technologie', aka: ['KIT', 'Karlsruhe Institute of Technology'], city: 'Karlsruhe', lat: 49.0094, lng: 8.4120 },
  { name: 'Universität Heidelberg', aka: ['Heidelberg University', 'Ruprecht-Karls-Universität'], city: 'Heidelberg', lat: 49.4106, lng: 8.7065 },
  { name: 'Universität Freiburg', aka: ['Albert-Ludwigs-Universität', 'University of Freiburg'], city: 'Freiburg', lat: 47.9936, lng: 7.8455 },
  { name: 'Universität Mannheim', aka: ['University of Mannheim'], city: 'Mannheim', lat: 49.4836, lng: 8.4622 },
  { name: 'Universität Tübingen', aka: ['Eberhard Karls Universität', 'University of Tübingen'], city: 'Tübingen', lat: 48.5245, lng: 9.0602 },
  { name: 'Universität Göttingen', aka: ['Georg-August-Universität', 'University of Göttingen'], city: 'Göttingen', lat: 51.5419, lng: 9.9361 },
  { name: 'Universität Münster', aka: ['WWU', 'University of Münster'], city: 'Münster', lat: 51.9636, lng: 7.6135 },
  { name: 'Universität Bonn', aka: ['University of Bonn'], city: 'Bonn', lat: 50.7339, lng: 7.1027 },
  { name: 'Friedrich-Alexander-Universität Erlangen-Nürnberg', aka: ['FAU'], city: 'Erlangen', lat: 49.5977, lng: 11.0042 },
  { name: 'Leibniz Universität Hannover', aka: ['LUH', 'University of Hannover'], city: 'Hannover', lat: 52.3822, lng: 9.7178 },
  { name: 'Ruhr-Universität Bochum', aka: ['RUB', 'Ruhr University Bochum'], city: 'Bochum', lat: 51.4446, lng: 7.2614 },
  { name: 'Technische Universität Darmstadt', aka: ['TU Darmstadt'], city: 'Darmstadt', lat: 49.8749, lng: 8.6566 },
  { name: 'Universität Würzburg', aka: ['JMU', 'University of Würzburg'], city: 'Würzburg', lat: 49.7881, lng: 9.9350 },
  { name: 'Johannes Gutenberg-Universität Mainz', aka: ['JGU', 'University of Mainz'], city: 'Mainz', lat: 49.9925, lng: 8.2405 },
  { name: 'Universität Bremen', aka: ['University of Bremen'], city: 'Bremen', lat: 53.1066, lng: 8.8525 },
  { name: 'Technische Universität Dortmund', aka: ['TU Dortmund'], city: 'Dortmund', lat: 51.4925, lng: 7.4135 },
  { name: 'Universität Regensburg', aka: ['University of Regensburg'], city: 'Regensburg', lat: 48.9984, lng: 12.0950 },
  { name: 'Universität Augsburg', aka: ['University of Augsburg'], city: 'Augsburg', lat: 48.3337, lng: 10.8975 },
  { name: 'Universität Kiel', aka: ['CAU', 'Kiel University'], city: 'Kiel', lat: 54.3467, lng: 10.1137 },
]

const keys = (u: University) => [u.name, ...u.aka].map(foldUmlauts)

/** Unis whose name, alias or city contains any of the (ascii-folded) terms. */
export function matchUniversities(terms: string[]): University[] {
  return UNIVERSITIES.filter(u =>
    terms.some(t => [...keys(u), foldUmlauts(u.city)].some(k => k.includes(t))))
}

/** Exact name/alias lookup (case/umlaut-insensitive), for typed-but-not-picked searches. */
export function findUniversity(text: string): University | null {
  const q = foldUmlauts(text.trim())
  return q ? UNIVERSITIES.find(u => keys(u).includes(q)) ?? null : null
}

export function universityPlace(u: University): Place {
  return { label: u.name, kind: 'area', street: '', houseNumber: '', postcode: '', city: u.city, lat: u.lat, lng: u.lng }
}
