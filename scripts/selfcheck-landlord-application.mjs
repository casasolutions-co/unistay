// Self-check for src/lib/landlordApplication.ts. Run with: node --experimental-strip-types scripts/selfcheck-landlord-application.mjs
import { parseLandlordApplication, DECLARATIONS, LANDLORD_TERMS_VERSION } from '../src/lib/landlordApplication.ts';
function assert(c, m) { if (!c) throw new Error('FAIL: ' + m); }
const ok = {
  rentalType: 'owner', listingCount: '1', phone: '+49 151 23456789',
  declarations: DECLARATIONS.map(d => d.key), termsVersion: LANDLORD_TERMS_VERSION,
};
const p = parseLandlordApplication(ok);
assert(p.ok && p.value.companyName === null, 'complete owner application passes, no company');
assert(!parseLandlordApplication({ ...ok, rentalType: 'pirate' }).ok, 'unknown rental type rejected');
assert(!parseLandlordApplication({ ...ok, listingCount: '100' }).ok, 'unknown count rejected');
assert(!parseLandlordApplication({ ...ok, phone: 'call me' }).ok, 'bad phone rejected');
assert(!parseLandlordApplication({ ...ok, declarations: ok.declarations.slice(1) }).ok, 'missing declaration rejected');
assert(!parseLandlordApplication({ ...ok, termsVersion: 'old' }).ok, 'wrong terms version rejected');
assert(!parseLandlordApplication({ ...ok, rentalType: 'agency' }).ok, 'agency needs company');
const a = parseLandlordApplication({ ...ok, rentalType: 'agency', companyName: ' Muster GmbH ', companyWebsite: 'muster.de' });
assert(a.ok && a.value.companyName === 'Muster GmbH' && a.value.companyWebsite === 'https://muster.de', 'agency trimmed + https added');
assert(!parseLandlordApplication({ ...ok, rentalType: 'agency', companyName: 'X', companyWebsite: 'nope' }).ok, 'agency bad website rejected');
assert(!parseLandlordApplication(null).ok, 'null body rejected');
console.log('landlord-application selfcheck OK');
