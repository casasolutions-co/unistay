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
    // Logged in: the event carries the new ids (every hook instance — cards, nav, the
    // Saved page — stays in step). Logged out: re-read localStorage.
    const syncFromLocal = (e?: Event) => {
      const ids = (e as CustomEvent<string[] | undefined> | undefined)?.detail;
      if (ids) setSavedIds(ids);
      else if (!tokenRef.current) setSavedIds(readLocalIds());
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

  const persist = useCallback(async (next: string[]) => {
    const user = auth.currentUser;
    if (!tokenRef.current || !user) {
      writeLocalIds(next);
      return;
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
    // getIdToken() refreshes the 1h Firebase token when needed — a token cached at
    // sign-in made every save after the first hour fail with a silent 401.
    const token = await user.getIdToken();
    const res = await fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ savedListingIds: next }),
    }).catch(() => null);
    if (!res?.ok) console.error('[saved] could not save to account', res?.status);
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggle = useCallback((id: string) => {
    // Compute from the current state, then persist outside the updater (updaters must be
    // pure — React may call them twice, which double-sent the PATCH).
    const next = savedIds.includes(id) ? savedIds.filter((x) => x !== id) : [...savedIds, id];
    setSavedIds(next);
    void persist(next);
  }, [savedIds, persist]);

  const remove = useCallback((id: string) => {
    if (!savedIds.includes(id)) return;
    const next = savedIds.filter((x) => x !== id);
    setSavedIds(next);
    void persist(next);
  }, [savedIds, persist]);

  return { savedIds, isSaved, toggle, remove };
}
