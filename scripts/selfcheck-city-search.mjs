// Self-check for city alias + university matching.
// Run with: node --experimental-strip-types scripts/selfcheck-city-search.mjs
import { registerHooks } from 'node:module';
// src/ uses extensionless relative imports (bundler resolution); resolve them to .ts.
registerHooks({ resolve: (s, c, next) => { try { return next(s, c); } catch (e) { if (s.startsWith('.')) return next(s + '.ts', c); throw e; } } });
const { cityNameVariants, citiesMatching } = await import('../src/lib/city-aliases.ts');
const { findUniversity, matchUniversities } = await import('../src/lib/universities.ts');
const { parseBbox, bboxParam, areaTooBig } = await import('../src/lib/mapArea.ts');

function assert(cond, msg) { if (!cond) throw new Error('FAIL: ' + msg); }

// Partner listings store "Munich"; either spelling must try both.
for (const q of ['München', 'Munich', 'munchen', ' MUNICH ']) {
  const v = cityNameVariants(q);
  assert(v.includes('munich') && v.includes('münchen'), `${q} → ${v}`);
}
assert(cityNameVariants('Frankfurt am Main').join() === 'frankfurt am main', 'non-alias city passes through');
assert(cityNameVariants('').length === 0, 'empty → no filter');

// Picker-list spelling (left) must find the stored partner spelling (right).
const stored = ['Munich', 'Offenbach', 'Freiburg', 'Garching bei München', 'Oldenburg', 'Sankt Ingbert',
  'Meissen', 'Rosbach vor der Höhe', 'Stolberg (Rheinland)', 'Frankfurt am Main', 'Köln', 'Münchingen'];
for (const [q, want] of [['München', 'Munich'], ['Offenbach am Main', 'Offenbach'], ['Freiburg im Breisgau', 'Freiburg'],
  ['Garching b.München', 'Garching bei München'], ['Oldenburg (Oldb)', 'Oldenburg'], ['St. Ingbert', 'Sankt Ingbert'],
  ['Meißen', 'Meissen'], ['Rosbach v.d.Höhe', 'Rosbach vor der Höhe'], ['Stolberg (Rhld.)', 'Stolberg (Rheinland)'],
  ['Frankfurt', 'Frankfurt am Main'], ['Cologne', 'Köln'], ['Korntal-Münchingen', 'Münchingen']]) {
  const got = citiesMatching(q, stored);
  assert(got.length === 1 && got[0] === want, `${q} → ${got}`);
}
assert(citiesMatching('Frankfurt (Oder)', stored).length === 0, 'Frankfurt (Oder) is not Frankfurt am Main');
assert(citiesMatching('Garching b.München', ['München', 'Munich']).length === 0, 'suburb does not pull in the city');

assert(findUniversity('tum')?.city === 'München', 'TUM by acronym');
assert(findUniversity('Technical University of Munich')?.city === 'München', 'TUM by English name');
assert(findUniversity('universitat zu koln')?.city === 'Köln', 'umlaut-insensitive');
assert(findUniversity('Berlin') === null, 'a city is not a uni');
assert(matchUniversities(['munich', 'munchen']).length >= 3, 'munich lists Munich unis');
// "Search this area" bounds.
const munich = parseBbox('48.08,11.45,48.20,11.70');
assert(munich && bboxParam(munich) === '48.0800,11.4500,48.2000,11.7000', 'bbox round-trips');
assert(parseBbox('48.2,11.45,48.08,11.7') === null, 'south must be < north');
assert(parseBbox('47,6,55,15') === null && areaTooBig([47, 6, 55, 15]), 'all of Germany is too big');
assert(parseBbox('a,b,c,d') === null && parseBbox(null) === null && parseBbox('1,2,3') === null, 'garbage rejected');
console.log('city search OK');
