// Self-check for src/lib/aboutMe.ts. Run with: node --experimental-strip-types scripts/selfcheck-about-me.mjs
import { aboutMeMissing, parseTraits, TRAITS } from '../src/lib/aboutMe.ts';
function assert(c, m) { if (!c) throw new Error('FAIL: ' + m); }
const ok = { hasPhoto: true, occupation: 'professional', traits: TRAITS.slice(0, 3), about: 'x'.repeat(40) };
assert(aboutMeMissing(ok).length === 0, 'complete profile passes');
assert(aboutMeMissing({ ...ok, hasPhoto: false })[0] === 'photo', 'photo required');
assert(aboutMeMissing({ ...ok, occupation: 'astronaut' }).length === 1, 'unknown occupation rejected');
assert(aboutMeMissing({ ...ok, traits: TRAITS.slice(0, 2) }).length === 1, 'too few traits');
assert(aboutMeMissing({ ...ok, traits: TRAITS.slice(0, 6) }).length === 1, 'too many traits');
assert(aboutMeMissing({ ...ok, traits: [...TRAITS.slice(0, 2), 'made up'] }).length === 1, 'unknown trait rejected');
assert(aboutMeMissing({ ...ok, about: '   short   ' }).length === 1, 'about too short');
assert(aboutMeMissing({ ...ok, about: 'x'.repeat(501) }).length === 1, 'about over 500');
assert(parseTraits('nope').length === 0 && parseTraits(null).length === 0, 'bad JSON → []');
console.log('about-me selfcheck OK');
