// Mirrors the 6-requirement checklist used client-side while composing a
// listing (src/app/list/page.tsx) so My Listings can show the same progress
// for a draft without re-deriving it from raw form state.
export interface ListingProgressInput {
  title: string | null;
  street: string | null;
  city: string | null;
  postcode: string | null;
  description: string | null;
  cold_rent: number | null;
  avail_from: string | null;
  avail_to: string | null;
  open_ended: number | null;
  amenity_count: number;
  photo_count: number;
}

export function computeListingProgress(l: ListingProgressInput): { pct: number; step: number; of: number } {
  const titleOk = !!l.title && l.title.length >= 12 && l.title.length <= 60;
  const addressOk = !!(l.street?.trim() && l.city?.trim() && l.postcode?.trim());
  const descOk = !!l.description && l.description.length >= 60;
  const availOk = !!l.avail_from && (l.open_ended === 1 || !!l.avail_to);

  const reqs = [
    titleOk,
    addressOk,
    l.amenity_count >= 1,
    descOk,
    !!l.cold_rent && availOk,
    l.photo_count >= 3,
  ];
  const step = reqs.filter(Boolean).length;
  const of = reqs.length;
  return { pct: Math.round((step / of) * 100), step, of };
}
