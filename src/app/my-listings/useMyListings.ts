import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export type PublishedStatus = 'pending_review' | 'published' | 'rented';

export interface DraftListing {
  id: string; title: string; location: string;
  pct: number; step: number; of: number; savedText: string;
}
export interface PublishedListing {
  id: string; title: string; location: string;
  status: PublishedStatus;
  rent: string; applications: number; publishedText: string; coverPhoto: string | null;
}

// Shared data/actions behind the My Listings page — identical on desktop and
// mobile, only the surrounding UI differs.
export function useMyListings() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<DraftListing[]>([]);
  const [published, setPublished] = useState<PublishedListing[]>([]);

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true); }), []);

  const fetchMine = useCallback(async (): Promise<{ drafts: DraftListing[]; published: PublishedListing[] }> => {
    if (!user) return { drafts: [], published: [] };
    const token = await user.getIdToken();
    const res = await fetch('/api/listings/mine', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json() as { drafts?: DraftListing[]; published?: PublishedListing[] };
    return { drafts: data.drafts ?? [], published: data.published ?? [] };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchMine()
      .then(data => { if (!cancelled) { setDrafts(data.drafts); setPublished(data.published); } })
      .catch(() => { if (!cancelled) { setDrafts([]); setPublished([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, fetchMine]);

  // Manual refetch (e.g. after Unpublish moves a listing to Drafts) — not tied
  // to an effect, so it's fine for this to call setState directly.
  const load = useCallback(async () => {
    try {
      const data = await fetchMine();
      setDrafts(data.drafts);
      setPublished(data.published);
    } catch {
      setDrafts([]);
      setPublished([]);
    }
  }, [fetchMine]);

  const authedFetch = useCallback(async (url: string, init: RequestInit) => {
    if (!user) return null;
    const token = await user.getIdToken();
    return fetch(url, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }, [user]);

  const deleteDraft = useCallback(async (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    await authedFetch(`/api/listings/${id}`, { method: 'DELETE' });
  }, [authedFetch]);

  const setStatus = useCallback(async (id: string, status: 'published' | 'rented' | 'draft') => {
    if (status === 'draft') {
      // Unpublish: moves the listing off the Published tab and into Drafts.
      const wasPublished = published.some(p => p.id === id);
      setPublished(prev => prev.filter(p => p.id !== id));
      if (wasPublished) load();
    } else {
      setPublished(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
    }
    await authedFetch(`/api/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'set_status', status }),
    });
  }, [authedFetch, published, load]);

  return { user, authReady, loading, drafts, published, deleteDraft, setStatus };
}
