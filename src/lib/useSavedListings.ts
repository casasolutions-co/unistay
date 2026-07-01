'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'unistay:savedListingIds';
const EVENT_NAME = 'unistay:saved-changed';

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useSavedListings() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setSavedIds(readIds());
    // Hydrate from localStorage after mount (SSR has no access to it).
    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggle = useCallback((id: string) => {
    const current = readIds();
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    writeIds(next);
    setSavedIds(next);
  }, []);

  const remove = useCallback((id: string) => {
    const current = readIds();
    if (!current.includes(id)) return;
    const next = current.filter(x => x !== id);
    writeIds(next);
    setSavedIds(next);
  }, []);

  return { savedIds, isSaved, toggle, remove };
}
