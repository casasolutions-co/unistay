// Self-check for src/lib/shrink-photo.ts (listing photo resize on upload).
// Run with: node --experimental-strip-types scripts/selfcheck-shrink-photo.mjs
import sharp from 'sharp';
import { shrinkPhoto } from '../src/lib/shrink-photo.ts';

const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#88a' } })
  .withMetadata({ exif: { IFD0: { Artist: 'gps-would-be-here' } } }).jpeg().toBuffer();
const out = await shrinkPhoto(big);
const m = await sharp(out).metadata();
if (m.width !== 1920 || m.height !== 1440) throw new Error('FAIL: not resized ' + m.width + 'x' + m.height);
if (m.format !== 'jpeg') throw new Error('FAIL: not jpeg');
if (m.exif) throw new Error('FAIL: metadata not stripped');
const small = await shrinkPhoto(await sharp({ create: { width: 800, height: 600, channels: 3, background: '#000' } }).png().toBuffer());
if ((await sharp(small).metadata()).width !== 800) throw new Error('FAIL: small image was enlarged');
console.log('shrink-photo OK');
