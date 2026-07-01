'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import AppNav from '../components/AppNav';
import MobileTabBar from '../components/MobileTabBar';
import PropertyCard, { type PropertyCardListing } from '../components/PropertyCard';
import { useSavedListings } from '@/lib/useSavedListings';
import styles from './page.module.css';

const PH_HUES = [
  { a: '#e9e3f5', b: '#f1ecfa' }, { a: '#e3ecf2', b: '#edf3f7' },
  { a: '#f0e8e2', b: '#f7f1ec' }, { a: '#e6eee8', b: '#f0f5f1' },
  { a: '#ece4f0', b: '#f4eef7' }, { a: '#e8ebe0', b: '#f1f3ec' },
];

const IHeartOutline = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7.2-4.5-10-9.3C.4 8.2 2 4.5 5.6 3.7 8 3.1 10.3 4.2 12 6.3c1.7-2.1 4-3.2 6.4-2.6C22 4.5 23.6 8.2 22 11.7 19.2 16.5 12 21 12 21Z" />
  </svg>
);

const IArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeListing(raw: any): PropertyCardListing {
  return {
    id: raw.id,
    title: raw.title,
    address: raw.address,
    area: raw.area,
    beds: raw.beds,
    price: raw.price,
    badge: raw.badge,
    avail: raw.avail,
    now: !!raw.now,
    incl: !!raw.incl,
    coverPhoto: raw.coverPhoto ?? raw.photos?.[0]?.url ?? null,
  };
}

export default function SavedPage() {
  const { savedIds, remove, toggle } = useSavedListings();
  const [listings, setListings] = useState<PropertyCardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ id: string; title: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (savedIds.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      savedIds.map(id =>
        fetch(`/api/listings/${id}`)
          .then(r => (r.ok ? r.json() : null))
          .then(data => (data?.listing ? normalizeListing(data.listing) : null))
          .catch(() => null)
      )
    ).then(results => {
      if (cancelled) return;
      setListings(results.filter((l): l is PropertyCardListing => l !== null));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [savedIds]);

  const handleUnsave = useCallback((id: string) => {
    const listing = listings.find(l => l.id === id);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    remove(id);
    setToast(listing ? { id, title: listing.title } : null);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, [listings, remove]);

  const handleUndo = useCallback(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toggle(toast.id);
    setToast(null);
  }, [toast, toggle]);

  const countText = loading
    ? ''
    : listings.length === 0
      ? 'No homes saved'
      : listings.length === 1
        ? '1 home saved'
        : `${listings.length} homes saved`;

  return (
    <div className={styles.page}>
      <AppNav />

      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Saved homes</h1>
            <p className={styles.count}>{countText}</p>
          </div>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImg} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineSm} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className={styles.grid}>
            {listings.map((l, i) => (
              <PropertyCard
                key={l.id}
                listing={l}
                hue={PH_HUES[i % PH_HUES.length]}
                saved
                onToggleSave={handleUnsave}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><IHeartOutline /></div>
            <div className={styles.emptyTitle}>No saved homes yet</div>
            <div className={styles.emptySub}>Tap the heart on any listing to save it here for later.</div>
            <Link href="/search" className={styles.emptyCta}>
              Explore homes <IArrow />
            </Link>
          </div>
        )}
      </div>

      {toast && (
        <div className={styles.toast}>
          <span className={styles.toastText}>Removed from saved</span>
          <button type="button" className={styles.undoBtn} onClick={handleUndo}>Undo</button>
        </div>
      )}

      <MobileTabBar active="saved" />
    </div>
  );
}
