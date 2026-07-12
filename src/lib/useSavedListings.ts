'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const STORAGE_KEY = 'unistay:savedListingIds';
const EVENT_NAME = 'unistay:saved-changed';

function readLocalIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT_NAME));
}

// Saved listings live on the account (users.preferences.savedListingIds) once
// signed in, so they follow the user across devices/browsers. Logged-out
// visitors still get local-only saving; anything saved before sign-in is
// merged into the account the moment they authenticate.
export function useSavedListings() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const syncFromLocal = () => {
      if (!tokenRef.current) setSavedIds(readLocalIds());
    };
    syncFromLocal();
    window.addEventListener(EVENT_NAME, syncFromLocal);
    window.addEventListener('storage', syncFromLocal);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        tokenRef.current = null;
        setSavedIds(readLocalIds());
        return;
      }

      const token = await user.getIdToken();
      tokenRef.current = token;
      const localIds = readLocalIds();

      try {
        const res = await fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        const serverIds: string[] = data?.user?.preferences?.savedListingIds ?? [];
        const merged = Array.from(new Set([...serverIds, ...localIds]));
        setSavedIds(merged);

        if (localIds.length > 0) {
          window.localStorage.removeItem(STORAGE_KEY);
          if (merged.length !== serverIds.length) {
            await fetch('/api/user/preferences', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ savedListingIds: merged }),
            });
          }
        }
      } catch {
        setSavedIds(localIds);
      }
    });

    return () => {
      window.removeEventListener(EVENT_NAME, syncFromLocal);
      window.removeEventListener('storage', syncFromLocal);
      unsubscribe();
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    const token = tokenRef.current;
    if (!token) {
      writeLocalIds(next);
      return;
    }
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ savedListingIds: next }),
    }).catch(() => {});
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggle = useCallback((id: string) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      persist(next);
      return next;
    });
  }, [persist]);

  const remove = useCallback((id: string) => {
    setSavedIds((current) => {
      if (!current.includes(id)) return current;
      const next = current.filter((x) => x !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  return { savedIds, isSaved, toggle, remove };
}
