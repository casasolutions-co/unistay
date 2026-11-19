import sharp from 'sharp';

/**
 * Re-encodes an uploaded listing photo for the web: auto-rotated from EXIF, max 1920px
 * on the long side, JPEG q82, all metadata (incl. GPS) stripped. A typical 4–8 MB phone
 * photo becomes ~300 KB, which is what makes listing pages load fast.
 * Input must be a format sharp can decode (JPEG/PNG/WebP — convert HEIC first).
 */
export async function shrinkPhoto(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
