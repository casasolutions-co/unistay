// One-off: re-saves listing photos already in R2 through shrinkPhoto (max 1920px, JPEG q82),
// under the SAME key, so listing_photos and every URL stay unchanged. Photos uploaded since
// shrinkPhoto went live are already small and get skipped (anything ≤ 400 KB).
//
// Step 1 (default, changes nothing): downloads every listing photo into backups/listing-photos/
// and prints the files it would shrink. Step 2 (--apply): shrinks from those backup files and
// uploads — it refuses any photo that has no backup on disk, so the backup always comes first.
// HEIC photos are left to convert-heic-photos.mjs.
//
// Needs the production env (same as convert-heic-photos.mjs) in .env.migrate, then:
//   node --env-file=.env.migrate --experimental-strip-types scripts/shrink-existing-photos.mjs          # backup + list
//   node --env-file=.env.migrate --experimental-strip-types scripts/shrink-existing-photos.mjs --apply  # shrink
// Restore one photo: upload the backup file back under its key (uploadToR2).
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { d1Query } from '../src/lib/d1.ts';
import { getSignedUrl, uploadToR2 } from '../src/lib/r2.ts';
import { shrinkPhoto } from '../src/lib/shrink-photo.ts';

const apply = process.argv.includes('--apply');
const BACKUP_DIR = 'backups/listing-photos';
const MIN_BYTES = 400_000;
const missing = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_D1_DATABASE_ID', 'CLOUDFLARE_API_TOKEN', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']
  .filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing env:', missing.join(', '));
  process.exit(1);
}

const rows = await d1Query(
  `SELECT DISTINCT r2_key FROM listing_photos
   WHERE LOWER(r2_key) NOT LIKE '%.heic' AND LOWER(r2_key) NOT LIKE '%.heif'
   ORDER BY r2_key`
);
const mb = n => (n / 1e6).toFixed(2) + ' MB';
console.log(`${rows.length} photo(s) in listing_photos${apply ? ' — APPLYING' : ' — backup + dry run (add --apply to shrink)'}`);

let todo = 0, todoBytes = 0, ok = 0, failed = 0, before = 0, after = 0;
for (const { r2_key: key } of rows) {
  if (key.includes('..')) { console.warn(`  skip suspicious key ${key}`); continue; }
  const file = join(BACKUP_DIR, key);
  try {
    if (!apply) {
      const size = await stat(file).then(s => s.size, async () => {
        const res = await fetch(getSignedUrl(key));
        if (!res.ok) throw new Error(`download failed (${res.status})`);
        const buf = Buffer.from(await res.arrayBuffer());
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, buf);
        return buf.length;
      });
      if (size > MIN_BYTES) { todo++; todoBytes += size; console.log(`  would shrink ${key} (${mb(size)})`); }
      continue;
    }

    const orig = await readFile(file).catch(() => null);
    if (!orig) throw new Error('no backup on disk — run without --apply first');
    if (orig.length <= MIN_BYTES) continue;
    const small = await shrinkPhoto(orig);
    if (small.length >= orig.length) { console.log(`  = ${key} already optimal`); continue; }
    await uploadToR2(key, small, 'image/jpeg');
    ok++; before += orig.length; after += small.length;
    console.log(`  ✓ ${key} ${mb(orig.length)} → ${mb(small.length)}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${key}: ${err.message}`);
  }
}

if (apply) console.log(`Done: ${ok} shrunk (${mb(before)} → ${mb(after)}), ${failed} failed.`);
else console.log(`${todo} file(s) to shrink, ${mb(todoBytes)} total. Backup in ${BACKUP_DIR}/${failed ? ` — ${failed} download(s) failed` : ''}.`);
