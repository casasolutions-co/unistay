import heicConvert from 'heic-convert';
import { sniffMime } from '@/lib/sniff-mime';
import { shrinkPhoto } from '@/lib/shrink-photo';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const HEIC_TYPES = ['image/heic', 'image/heif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per photo
// Extension is derived from the sniffed content type, never the client filename,
// so it can't be used for path traversal in the R2 key.
const EXT_FOR_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif',
};

export type PreparedImage = { buffer: Buffer; contentType: string; ext: string };

/**
 * Validates an uploaded photo and re-encodes it for the web. Shared by listing photos
 * and profile photos. Returns { error } with a user-facing message on bad input.
 */
export async function prepareImage(file: File, logTag: string): Promise<PreparedImage | { error: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Only JPEG, PNG, WebP and HEIC images are allowed' };
  if (file.size > MAX_BYTES) return { error: 'Photo must be under 10 MB' };

  let buffer = Buffer.from(await file.arrayBuffer());

  // The declared file.type is whatever the browser/client claims — sniff the
  // actual bytes so a renamed/relabeled file can't sneak past the allow-list.
  const sniffed = sniffMime(buffer, file.type);
  if (!sniffed || !ALLOWED_TYPES.includes(sniffed)) return { error: 'File content does not match its declared type' };
  let contentType = sniffed;
  let ext = EXT_FOR_TYPE[contentType] ?? 'jpg';

  // Browsers can't render HEIC/HEIF natively — convert to JPEG so uploaded
  // photos actually display once stored, instead of ever hitting R2 as HEIC.
  if (HEIC_TYPES.includes(contentType)) {
    try {
      buffer = Buffer.from(await heicConvert({ buffer, format: 'JPEG', quality: 0.9 }));
      contentType = 'image/jpeg';
      ext = 'jpg';
    } catch (err) {
      console.error(`[${logTag}] HEIC conversion failed:`, err);
      return { error: 'Could not process this HEIC photo. Try converting it to JPEG first.' };
    }
  }

  try {
    buffer = Buffer.from(await shrinkPhoto(buffer));
    contentType = 'image/jpeg';
    ext = 'jpg';
  } catch (err) {
    // Unusual-but-valid image sharp can't handle — store the original rather than fail.
    console.error(`[${logTag}] resize failed, storing original:`, err);
  }

  return { buffer, contentType, ext };
}
