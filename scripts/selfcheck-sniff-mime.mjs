// Self-check for src/lib/sniff-mime.ts (magic-byte upload validation).
// Run with: node --experimental-strip-types scripts/selfcheck-sniff-mime.mjs
import { sniffMime } from '../src/lib/sniff-mime.ts';

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
}

assert(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0, 0]), 'image/jpeg') === 'image/jpeg', 'jpeg detected');
assert(sniffMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/png') === 'image/png', 'png detected');
assert(sniffMime(Buffer.from('%PDF-1.4'), 'application/pdf') === 'application/pdf', 'pdf detected');
assert(
  sniffMime(Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')]), 'image/webp') === 'image/webp',
  'webp detected'
);
assert(sniffMime(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), 'application/msword') === 'application/msword', 'doc (OLE) detected');
assert(
  sniffMime(Buffer.from([0x50, 0x4b, 0x03, 0x04]), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'docx (zip) detected'
);

// The actual point of this module: bytes win over the client-declared type.
assert(
  sniffMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'image/jpeg') === 'image/png',
  'a PNG relabeled as image/jpeg is still sniffed as image/png, not trusted as jpeg'
);
assert(sniffMime(Buffer.from('just some text'), 'image/jpeg') === null, 'unrecognized bytes return null regardless of declared type');

console.log('sniff-mime self-check: all assertions passed');
