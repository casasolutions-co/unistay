// Self-check for src/lib/places.ts (address autocomplete). Hits the
// live Photon API, so needs network.
// Run with: node --experimental-strip-types scripts/selfcheck-places.mjs
import { searchPlaces } from '../src/lib/places.ts';

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
}
const run = qs => { const sp = new URLSearchParams(qs); return searchPlaces(sp.get('q') ?? '', sp.get('mode')); };

const addr = await run('q=' + encodeURIComponent('leopoldstr 12 münchen'));
const a = addr[0];
assert(a?.kind === 'address' && a.street === 'Leopoldstraße' && a.houseNumber === '12', 'street + number parsed');
assert(a.city === 'München' && a.postcode === '80802', 'city + postcode parsed');

const area = await run('q=schwabing');
assert(area.some(p => p.kind === 'area' && p.city === 'München'), 'neighbourhood resolves to its city');

const onlyAddr = await run('q=' + encodeURIComponent('oranienstraße berlin') + '&mode=address');
assert(onlyAddr.length > 0 && onlyAddr.every(p => p.kind === 'address' || p.kind === 'street'), 'address mode excludes areas');

assert((await run('q=ab')).length === 0, 'short query returns nothing');
console.log('places OK');

// Mapbox mapping, against a stubbed v6 response (no token needed).
const realFetch = globalThis.fetch;
let calledUrl = '';
globalThis.fetch = async url => {
  calledUrl = String(url);
  return new Response(JSON.stringify({ features: [
    { properties: { feature_type: 'address', name: 'Leopoldstraße 12',
      coordinates: { latitude: 48.1532, longitude: 11.5841 },
      context: { address: { name: 'Leopoldstraße 12', address_number: '12', street_name: 'Leopoldstraße' },
        street: { name: 'Leopoldstraße' }, postcode: { name: '80802' }, place: { name: 'München' } } } },
    { properties: { feature_type: 'neighborhood', name: 'Schwabing',
      coordinates: { latitude: 48.16, longitude: 11.58 }, context: { place: { name: 'München' } } } },
    { properties: { feature_type: 'place', name: 'München',
      coordinates: { latitude: 48.137, longitude: 11.575 }, context: {} } },
  ] }));
};
process.env.MAPBOX_TOKEN = 'pk.test';
const mb = await searchPlaces('leopoldstr 12', 'any');
globalThis.fetch = realFetch;
delete process.env.MAPBOX_TOKEN;
assert(calledUrl.startsWith('https://api.mapbox.com/search/geocode/v6/forward?') && calledUrl.includes('country=de'), 'mapbox url');
assert(mb[0].label === 'Leopoldstraße 12, 80802 München' && mb[0].houseNumber === '12' && mb[0].street === 'Leopoldstraße', 'mapbox address');
assert(mb[1].kind === 'area' && mb[1].label === 'Schwabing, München', 'mapbox neighbourhood');
assert(mb[2].kind === 'city' && mb[2].label === 'München', 'mapbox city');
console.log('mapbox mapping OK');
