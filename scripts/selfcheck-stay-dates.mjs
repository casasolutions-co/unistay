// Self-check for src/lib/stayDates.ts. Run with: node --experimental-strip-types scripts/selfcheck-stay-dates.mjs
import { defaultStay, stayError, todayIso } from '../src/lib/stayDates.ts';
function assert(c, m) { if (!c) throw new Error('FAIL: ' + m); }
const t = todayIso();
let d = defaultStay('2020-01-01', null);
assert(d.moveIn === t, 'past availability → today');
d = defaultStay('2099-03-15', 12);
assert(d.moveIn === '2099-03-15' && d.moveOut === '2100-03-15', 'future availability + min period');
d = defaultStay('2099-03-15', null, { moveIn: '2099-01-01', moveOut: '2099-02-01' });
assert(d.moveIn === '2099-03-15' && d.moveOut === '2099-09-15', 'wanted move-in before availability ignored; 6-month default');
d = defaultStay(null, null, { moveIn: '2099-05-01', moveOut: '2099-11-30' });
assert(d.moveIn === '2099-05-01' && d.moveOut === '2099-11-30', 'valid wanted dates kept');
assert(stayError('2020-01-01', '2020-06-01'), 'past move-in rejected');
assert(stayError('2099-05-01', '2099-04-01'), 'reversed dates rejected');
assert(stayError('2099-05-01', 'x'), 'bad format rejected');
assert(stayError('2099-05-01', '2099-11-30') === null, 'good dates accepted');
console.log('stay-dates OK');
