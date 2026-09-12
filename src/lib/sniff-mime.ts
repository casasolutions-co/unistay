// A client-declared file.type can be spoofed by renaming/relabeling before
// upload. This checks the file's actual leading bytes against the small set
// of formats the app accepts, instead of trusting the browser's header.
// ponytail: covers only the formats these routes allow-list, not a general
// file-type sniffer — extend the table if a new upload type is added.
const SIGNATURES: { mime: string; matches: (b: Buffer) => boolean }[] = [
  { mime: 'image/jpeg', matches: b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', matches: b => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/webp', matches: b => b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  {
    mime: 'image/heic',
    matches: b => {
      if (b.length < 12 || b.subarray(4, 8).toString('ascii') !== 'ftyp') return false;
      const brand = b.subarray(8, 12).toString('ascii');
      return ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1'].includes(brand);
    },
  },
  { mime: 'application/pdf', matches: b => b.length >= 5 && b.subarray(0, 5).toString('ascii') === '%PDF-' },
  { mime: 'application/msword', matches: b => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) },
  // .docx (and any other OOXML/zip-based Office format) is a zip archive —
  // "PK\x03\x04" is the real signature; can't distinguish it from a plain
  // zip by magic bytes alone, which is an accepted limitation of this check.
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', matches: b => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04 },
];

// Returns the sniffed mime type (which may differ from `declaredType`, e.g.
// 'image/heif' vs 'image/heic' share one signature) or null if the bytes
// don't match any known format at all.
export function sniffMime(buffer: Buffer, declaredType: string): string | null {
  const sig = SIGNATURES.find(s => s.matches(buffer));
  if (!sig) return null;
  // HEIC/HEIF share the same ftyp-box signature — accept either declared
  // label as long as the bytes are a heic-family file.
  if (sig.mime === 'image/heic' && (declaredType === 'image/heic' || declaredType === 'image/heif')) {
    return declaredType;
  }
  return sig.mime;
}
