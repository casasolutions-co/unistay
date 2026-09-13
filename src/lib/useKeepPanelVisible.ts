'use client';

import { useEffect, type RefObject } from 'react';
import { scrollFullyIntoView } from './scrollFullyIntoView';

// Keeps `ref`'s bottom edge on-screen for as long as `active` is true.
// A one-time scroll-on-open isn't enough here: the when-panel changes height
// while open (the "open-ended stay" banner appears after picking a move-in
// date with no move-out yet), which can push Apply back below the fold — so
// re-check on every resize, not just once.
export function useKeepPanelVisible(active: boolean, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    scrollFullyIntoView(el);
    const ro = new ResizeObserver(() => scrollFullyIntoView(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, [active, ref]);
}
