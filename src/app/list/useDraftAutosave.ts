import { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface DraftFields {
  ptype: string;
  title: string;
  streetName: string;
  houseNumber: string;
  city: string;
  postcode: string;
  bedrooms: number;
  bathrooms: number;
  roomSize: number;
  aptSize: number;
  amenities: Record<string, boolean>;
  desc: string;
  mates: string;
  numMates: number;
  mateGender: string;
  prefGender: string;
  rent: string;
  utilities: string;
  deposit: string;
  availFrom: string;
  availTo: string;
  openEnded: boolean;
  minPeriod: string;
  maxPeriod: string;
  photos: { r2Key: string; position: number; isCover: boolean }[];
}

const DEBOUNCE_MS = 1200;

// Debounced autosave for the List Your Place form. Skips saving until there's
// "first meaningful input" (title or street) so opening the form doesn't
// silently create an empty draft row, and waits for `ready` so a resumed
// draft's initial prefill isn't immediately re-saved over itself.
export function useDraftAutosave(
  user: User | null,
  listingId: string,
  fields: DraftFields,
  ready: boolean
): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>('');
  const snapshot = JSON.stringify(fields);

  useEffect(() => {
    if (!user || !ready) return;
    if (!fields.title.trim() && !fields.streetName.trim()) return;
    if (snapshot === lastSaved.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus('saving');
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/listings/${listingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: snapshot,
        });
        if (!res.ok) throw new Error('save failed');
        lastSaved.current = snapshot;
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, DEBOUNCE_MS);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, listingId, ready, snapshot]);

  return status;
}
