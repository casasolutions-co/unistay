// One-off: converts listing photos stored as HEIC/HEIF in R2 (admin uploads before the
// casa-photos fix) to web-sized JPEG, so they display in every browser.
//
// Per photo: download → HEIC→JPEG → resize (shrinkPhoto) → upload as <same name>.jpg →
// point listing_photos.r2_key at it → delete the old HEIC. The old object is only deleted
// after the DB row points at the new one, so a crash mid-way never leaves a broken photo;
// re-running just picks up whatever is still HEIC.
//
// Needs the production env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID,
// CLOUDFLARE_API_TOKEN, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
// Put them in .env.migrate (gitignored by .env*), then:
//   node --env-file=.env.migrate --experimental-strip-types scripts/convert-heic-photos.mjs          # dry run
//   node --env-file=.env.migrate --experimental-strip-types scripts/convert-heic-photos.mjs --apply  # do it
import heicConvert from 'heic-convert';
import { d1Query } from '../src/lib/d1.ts';
import { getSignedUrl, uploadToR2, deleteFromR2 } from '../src/lib/r2.ts';
import { shrinkPhoto } from '../src/lib/shrink-photo.ts';

const apply = process.argv.includes('--apply');
const missing = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_D1_DATABASE_ID', 'CLOUDFLARE_API_TOKEN', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
  .filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing env:', missing.join(', '));
  process.exit(1);
}

const rows = await d1Query(
  `SELECT id, listing_id, r2_key FROM listing_photos
   WHERE LOWER(r2_key) LIKE '%.heic' OR LOWER(r2_key) LIKE '%.heif'`
);
console.log(`${rows.length} HEIC photo(s) found${apply ? '' : ' — dry run, nothing will change (add --apply)'}`);

let ok = 0, failed = 0;
for (const row of rows) {
  const newKey = row.r2_key.replace(/\.(heic|heif)$/i, '.jpg');
  if (!apply) {
    console.log(`  would convert ${row.r2_key} → ${newKey}`);
    continue;
  }
  try {
    const res = await fetch(getSignedUrl(row.r2_key));
    if (!res.ok) throw new Error(`download failed (${res.status})`);
    const heic = Buffer.from(await res.arrayBuffer());
    const jpeg = await shrinkPhoto(Buffer.from(await heicConvert({ buffer: heic, format: 'JPEG', quality: 0.9 })));

    await uploadToR2(newKey, jpeg, 'image/jpeg');
    await d1Query('UPDATE listing_photos SET r2_key = ? WHERE id = ?', [newKey, row.id]);
    await deleteFromR2(row.r2_key).catch(err => console.warn(`  (old file not deleted: ${err.message})`));

    ok++;
    console.log(`  ✓ ${row.r2_key} → ${newKey} (${(heic.length / 1e6).toFixed(1)} MB → ${(jpeg.length / 1e6).toFixed(2)} MB)`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${row.r2_key}: ${err.message}`);
  }
}
if (apply) console.log(`Done: ${ok} converted, ${failed} failed. Search results refresh within 5 minutes.`);
