'use client';

import { useEffect, useState } from 'react';
import type { Place } from '@/lib/places';

export type { Place };

/** Debounced address/place suggestions from /api/places (Germany only). */
export function usePlaceSearch(query: string, mode: 'any' | 'address' = 'any', enabled = true) {
  const [places, setPlaces] = useState<Place[]>([]);
  const q = query.trim();
  const active = enabled && q.length >= 3;

  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/places?${new URLSearchParams({ q, mode })}`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(setPlaces)
        .catch(() => {});
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, mode, active]);

  return active ? places : [];
}
