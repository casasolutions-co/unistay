const HEIC_TYPES = ['image/heic', 'image/heif'];

function looksLikeHeic(file: File): boolean {
  return HEIC_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name);
}

// iPhones upload HEIC by default, but only Safari can render it in an <img>/
// object URL. Convert to a JPEG blob client-side so the preview thumbnail
// (shown while the real upload+server-side conversion is in flight) actually
// displays in Chrome/Firefox too.
export async function previewUrlFor(file: File): Promise<string> {
  if (!looksLikeHeic(file)) return URL.createObjectURL(file);

  try {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('[previewUrlFor] HEIC preview conversion failed:', err);
    return URL.createObjectURL(file);
  }
}
