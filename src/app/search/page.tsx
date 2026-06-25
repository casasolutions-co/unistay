'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import type { MapProperty } from './MapPanel';
import type { UnifiedListing } from '@/lib/listings/types';
import AppNav from '../components/AppNav';
import MobileTabBar from '../components/MobileTabBar';
import { useCitySearch } from '@/lib/useCitySearch';

const MapPanel = dynamic(() => import('./MapPanel'), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */

const PH_HUES = [
  { a: '#e9e3f5', b: '#f1ecfa' }, { a: '#e3ecf2', b: '#edf3f7' },
  { a: '#f0e8e2', b: '#f7f1ec' }, { a: '#e6eee8', b: '#f0f5f1' },
  { a: '#ece4f0', b: '#f4eef7' }, { a: '#e8ebe0', b: '#f1f3ec' },
];

const TYPES    = ['Any type', 'Studio', 'Shared flat (WG)', '1-bedroom apartment', '2+ bedrooms'];
const SOURCES  = [{ k: 'all', l: 'All listings' }, { k: 'CASA', l: 'Casa only' }, { k: 'PARTNER', l: 'Partner only' }];
const SORTS    = [{ k: 'featured', l: 'Featured first' }, { k: 'price_asc', l: 'Price: low to high' }, { k: 'price_desc', l: 'Price: high to low' }, { k: 'area_desc', l: 'Largest first' }];
const BUDGET_P = [{ label: 'Any', min: 0, max: 3000 }, { label: '≤ €500', min: 0, max: 500 }, { label: '≤ €800', min: 0, max: 800 }, { label: '≤ €1,200', min: 0, max: 1200 }, { label: '≤ €2,000', min: 0, max: 2000 }];
const DURATION = [{ label: 'This month', mi: '2026-06-23', mo: '2026-07-23' }, { label: 'Next semester', mi: '2026-10-01', mo: '2027-03-31' }, { label: 'Full year', mi: '2026-10-01', mo: '2027-09-30' }];


/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
type OpenPanel = 'search' | 'when' | 'price' | 'type' | 'source' | 'sort' | null;

function fmtN(n: number) { return n.toLocaleString('en-US'); }

function fmtDate(s: string) {
  if (!s) return '';
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const p = s.split('-');
  return parseInt(p[2], 10) + ' ' + M[parseInt(p[1], 10) - 1];
}


/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const ISearch = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>;
const IClose  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>;
const IFilters = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>;
const IChevSm = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const IMapIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>;
const IListIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h13M3 12h11M3 18h7"/></svg>;
const IHeart = ({ saved }: { saved: boolean }) => <svg width="19" height="19" viewBox="0 0 24 24" fill={saved ? '#6d28d9' : 'none'} stroke={saved ? '#6d28d9' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>;
const IChev   = ({ open }: { open: boolean }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="m6 9 6 6 6-6"/></svg>;
const IChevW  = ({ open }: { open: boolean }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="m6 9 6 6 6-6"/></svg>;
const ICheck  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
const ICal    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>;
const ISort   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h13M3 12h9M3 18h5M18 9l3-3-3-3M21 6v12"/></svg>;
const IUni    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5"/></svg>;
const IClock  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
const IPin    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IBell   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>;
const IPlus   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const IArea   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0aabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 3 21M9 3H3v6M21 15v6h-6"/></svg>;
const IBed    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0aabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 11h20M2 11V6a2 2 0 0 1 2-2h6v7M22 11v6M2 17h20M4 20v-3M20 20v-3"/></svg>;

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ── Panel state ── */
  const [open, setOpen]       = useState<OpenPanel>(null);
  const toggle = useCallback((name: OpenPanel) => setOpen(o => o === name ? null : name), []);
  const isOpen = (name: OpenPanel) => open === name;

  /* ── Nav search ── */
  const { query, setQuery, groups, selectCity } = useCitySearch(searchParams.get('city') ?? 'Munich');

  /* ── Mobile state ── */
  const [mobileSheet,     setMobileSheet]     = useState<'filters' | 'sort' | null>(null);
  const [mobileMapOpen,   setMobileMapOpen]   = useState(false);
  const [mobileSaved,     setMobileSaved]     = useState<Record<string, boolean>>({});

  /* ── Filter state ── */
  const [filterType,   setFilterType]   = useState(() => searchParams.get('type') ?? 'Any type');
  const [filterSource, setFilterSource] = useState('all');
  const [filterSort,   setFilterSort]   = useState('featured');
  const [minVal,       setMinVal]       = useState(() => Number(searchParams.get('minPrice') ?? 0));
  const [maxVal,       setMaxVal]       = useState(() => Number(searchParams.get('maxPrice') ?? 3000));
  const [moveIn,       setMoveIn]       = useState(() => searchParams.get('moveIn') ?? '2026-06-23');
  const [moveOut,      setMoveOut]      = useState(() => searchParams.get('moveOut') ?? '2026-07-01');

  /* ── Derived filter values ── */
  const lo            = Math.min(minVal, maxVal);
  const hi            = Math.max(minVal, maxVal);
  const budgetDefault = lo === 0 && hi === 3000;
  const typeSet       = filterType   !== 'Any type';
  const priceSet      = !budgetDefault;
  const sourceSet     = filterSource !== 'all';
  const sortSet       = filterSort   !== 'featured';
  const hasWhen       = !!(moveIn && moveOut);
  const fillLeft      = (lo / 3000 * 100).toFixed(2) + '%';
  const fillRight     = (100 - hi / 3000 * 100).toFixed(2) + '%';

  const activeFiltersCount = [typeSet, priceSet, sourceSet, hasWhen].filter(Boolean).length;

  /* ── Pill class helper ── */
  const pc = (name: OpenPanel, set: boolean) =>
    isOpen(name) ? styles.pillOpen : set ? styles.pillSet : styles.pill;


  /* ── API-fetched listings ── */
  const [listings, setListings]         = useState<UnifiedListing[]>([]);
  const [partnerTotal, setPartnerTotal] = useState(0);
  const [hasMore, setHasMore]           = useState(false);
  const [loading,     setLoading]       = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [page, setPage]                 = useState(1);

  useEffect(() => {
    setPage(1);
    setListings([]);
  }, [query, filterType, filterSource, minVal, maxVal, moveIn]);

  useEffect(() => {
    if (!query.trim()) return;
    const params = new URLSearchParams({ city: query.trim(), page: String(page) });
    if (minVal > 0)              params.set('minPrice', String(lo));
    if (maxVal < 3000)           params.set('maxPrice', String(hi));
    if (typeSet)                 params.set('type', filterType);
    if (sourceSet)               params.set('source', filterSource);
    if (moveIn)                  params.set('moveIn', moveIn);

    const ctrl = new AbortController();
    if (page === 1) setLoading(true); else setLoadingMore(true);
    fetch(`/api/listings?${params}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        setListings(prev => page === 1 ? data.listings : [...prev, ...data.listings]);
        setPartnerTotal(data.partnerTotal);
        setHasMore(data.hasMore);
        setLoading(false);
        setLoadingMore(false);
      })
      .catch(() => { setLoading(false); setLoadingMore(false); });
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page, filterType, filterSource, lo, hi, moveIn]);

  let filtered = listings;
  if      (filterSort === 'price_asc')  filtered = [...listings].sort((a, b) => a.price - b.price);
  else if (filterSort === 'price_desc') filtered = [...listings].sort((a, b) => b.price - a.price);
  else if (filterSort === 'area_desc')  filtered = [...listings].sort((a, b) => b.area  - a.area);

  const mapProps: MapProperty[] = filtered.map(p => ({
    id: p.id, title: p.title, address: p.address, price: p.price,
    featured: p.featured, lat: p.lat, lng: p.lng,
    now: p.now, avail: p.avail,
  }));


  const cityName = query.trim();

  const resetFilters = () => {
    setFilterType('Any type'); setFilterSource('all');
    setMinVal(0); setMaxVal(3000); setQuery(''); setOpen(null);
  };

  return (
    <div className={styles.page}>
      {/* ══════════════════════════════════════════════════════════
          MOBILE LAYOUT (< 768px)
      ══════════════════════════════════════════════════════════ */}
      <div className={styles.mobileOnly}>

        {/* ── Fixed header ── */}
        <div className={styles.mobileHeader}>
          {/* search row */}
          <div className={styles.mobileSearchRow}>
            <div className={styles.mobileSearchField}>
              <span className={styles.mobileSearchIcon}><ISearch /></span>
              <input
                type="text"
                className={styles.mobileSearchInput}
                placeholder="City or university…"
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen('search'); }}
                onFocus={() => setOpen('search')}
              />
              {query.trim().length > 0 && (
                <button type="button" className={styles.mobileSearchClear}
                  onClick={() => { setQuery(''); setOpen('search'); }}>
                  <IClose />
                </button>
              )}
            </div>
            <button type="button" className={styles.mobileBellBtn}>
              <IBell />
              <span className={styles.mobileBellDot} />
            </button>
          </div>

          {/* filter chip strip */}
          <div className={styles.mobileChipStrip}>
            <button
              type="button"
              className={activeFiltersCount > 0 ? styles.chipFiltersActive : styles.chipFilters}
              onClick={() => setMobileSheet('filters')}
            >
              <IFilters />
              Filters
              {activeFiltersCount > 0 && (
                <span className={styles.chipBadge}>{activeFiltersCount}</span>
              )}
            </button>
            <button type="button"
              className={hasWhen ? styles.chipActive : styles.chip}
              onClick={() => setMobileSheet('filters')}>
              {hasWhen ? `${fmtDate(moveIn)} – ${fmtDate(moveOut)}` : 'When'}
              <span className={styles.chipChev}><IChevSm /></span>
            </button>
            <button type="button"
              className={priceSet ? styles.chipActive : styles.chip}
              onClick={() => setMobileSheet('filters')}>
              {priceSet ? `€${fmtN(lo)}–€${fmtN(hi)}` : 'Price'}
              <span className={styles.chipChev}><IChevSm /></span>
            </button>
            <button type="button"
              className={typeSet ? styles.chipActive : styles.chip}
              onClick={() => setMobileSheet('filters')}>
              {typeSet ? filterType : 'Type'}
              <span className={styles.chipChev}><IChevSm /></span>
            </button>
            <button type="button"
              className={sourceSet ? styles.chipActive : styles.chip}
              onClick={() => setMobileSheet('filters')}>
              {SOURCES.find(s => s.k === filterSource)!.l}
              <span className={styles.chipChev}><IChevSm /></span>
            </button>
          </div>
        </div>

        {/* ── Search suggestions overlay ── */}
        {open === 'search' && (
          <div className={styles.mobileSuggestOverlay} onClick={() => setOpen(null)}>
            <div className={styles.mobileSuggestScroll} onClick={e => e.stopPropagation()}>
              {groups.length === 0 ? (
                <div className={styles.mobileSuggestEmpty}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1c1530', marginBottom: 4 }}>No matches</div>
                  <div style={{ fontSize: 13, color: '#9a94a8' }}>Try a different city or university name.</div>
                </div>
              ) : groups.map(group => (
                <div key={group.title}>
                  <div className={styles.groupHeader}>
                    <span>{group.title}</span><span className={styles.groupLine} />
                  </div>
                  {group.items.map(item => (
                    <button key={item.name} type="button" className={styles.suggestRow}
                      onClick={() => {
                        selectCity(item.name, item.sub, item.kind);
                        setQuery(item.name); setOpen(null);
                      }}>
                      <span className={styles.suggestIcon} style={{
                        background: item.kind === 'uni' ? 'var(--tint-indigo)' : 'var(--tint)',
                        color:      item.kind === 'uni' ? 'var(--uni-accent)' : 'var(--brand)',
                      }}>
                        {item.kind === 'uni'    && <IUni />}
                        {item.kind === 'recent' && <IClock />}
                        {item.kind === 'city'   && <IPin />}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className={styles.suggestName}>{item.name}</span>
                        <span className={styles.suggestSub}>{item.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Results scroll area ── */}
        <div className={styles.mobileResults}>
          {/* count + sort row */}
          <div className={styles.mobileResultsBar}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span className={styles.mobileResultCount}>{partnerTotal + filtered.filter(l => l.source === 'casa').length || filtered.length}</span>
              <span className={styles.mobileResultSub}>stays{cityName ? ` in ${cityName}` : ''}</span>
            </div>
            <button type="button" className={styles.mobileSortBtn} onClick={() => setMobileSheet('sort')}>
              <ISort />
              {SORTS.find(s => s.k === filterSort)!.l}
            </button>
          </div>

          {/* cards */}
          {loading ? (
            <div className={styles.mobileCards}>
              {[0,1,2,3].map(i => (
                <div key={i} className={styles.mobileCard} style={{ opacity: 0.5 }}>
                  <div className={styles.mobileCardImg} style={{ background: '#e9e3f5' }} />
                  <div className={styles.mobileCardBody}>
                    <div style={{ height: 14, borderRadius: 6, background: '#e9e3f5', marginBottom: 8, width: '70%' }} />
                    <div style={{ height: 11, borderRadius: 6, background: '#f0edf7', width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className={styles.mobileCards}>
              {filtered.map((p, i) => {
                const hue = PH_HUES[i % PH_HUES.length];
                const saved = mobileSaved[p.id] || false;
                return (
                  <div key={p.id} className={styles.mobileCard}>
                    <Link href={`/search/${p.id}`} className={styles.mobileCardLink}>
                      <div className={styles.mobileCardImg}
                        style={p.coverPhoto ? { backgroundImage: `url(${p.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: `repeating-linear-gradient(135deg, ${hue.a} 0 15px, ${hue.b} 15px 30px)` }}>
                        <span className={styles.mobileCardBadge}
                          style={{ background: p.badge === 'PARTNER' ? '#1c1530' : '#6d28d9' }}>
                          {p.badge}
                        </span>
                        {!p.coverPhoto && <span className={styles.mobileCardImgLabel}>[ photo ]</span>}
                      </div>
                      <div className={styles.mobileCardBody}>
                        <h3 className={styles.mobileCardTitle}>{p.title}</h3>
                        <p className={styles.mobileCardAddress}>{p.address}</p>
                        <div className={styles.mobileCardMeta}>
                          <span className={styles.cardMetaItem}><IArea /> {p.area} m²</span>
                          <span className={styles.cardMetaItem}><IBed /> {p.beds}</span>
                        </div>
                        <div className={styles.mobileCardFooter}>
                          <div>
                            <span className={styles.cardPrice}>€{fmtN(p.price)}</span>
                            <span className={styles.cardPriceUnit}> /month</span>
                            {p.incl && <div className={styles.cardIncl}>incl. utilities</div>}
                          </div>
                          <span className={styles.cardAvail} style={{ color: p.now ? '#1f8a5b' : '#9a94a8' }}>
                            <span className={styles.cardAvailDot} style={{ background: p.now ? '#27ae73' : '#cfc8dd' }} />
                            {p.avail}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <button type="button" className={styles.mobileSaveBtn}
                      onClick={() => setMobileSaved(s => ({ ...s, [p.id]: !s[p.id] }))}>
                      <IHeart saved={saved} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.mobileNoResults}>
              <div className={styles.noResultsIcon}><ISearch /></div>
              <div className={styles.noResultsTitle}>No places match</div>
              <div className={styles.noResultsSub}>Try widening your budget or clearing a filter.</div>
              <button type="button" className={styles.resetBtn} onClick={resetFilters}>Reset filters</button>
            </div>
          )}

          {hasMore && (
            <div style={{ padding: '16px 16px 0', textAlign: 'center' }}>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => setPage(p => p + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}

          <div style={{ height: 48 }} />
        </div>

        {/* ── Map FAB ── */}
        {!mobileMapOpen && (
          <button type="button" className={styles.mobileMapFab} onClick={() => setMobileMapOpen(true)}>
            <IMapIcon /> Map
          </button>
        )}

        {/* ── Map overlay ── */}
        {mobileMapOpen && (
          <div className={styles.mobileMapOverlay}>
            <MapPanel properties={mapProps} />
            <button type="button" className={styles.mobileListFab} onClick={() => setMobileMapOpen(false)}>
              <IListIcon /> List
            </button>
          </div>
        )}

        {/* ── Bottom sheets scrim ── */}
        {mobileSheet && (
          <div className={styles.mobileScrim} onClick={() => setMobileSheet(null)} />
        )}

        {/* ── Filters sheet ── */}
        {mobileSheet === 'filters' && (
          <div className={styles.mobileSheet}>
            <div className={styles.mobileSheetHandle} />
            <div className={styles.mobileSheetHeader}>
              <span className={styles.mobileSheetTitle}>Filters</span>
              <button type="button" className={styles.mobileSheetClear} onClick={resetFilters}>Clear all</button>
            </div>
            <div className={styles.mobileSheetBody}>
              {/* price */}
              <div className={styles.mobileSheetSection}>
                <div className={styles.mobileSheetSectionHeader}>
                  <span className={styles.mobileSheetLabel}>Monthly rent</span>
                  <span className={styles.mobileSheetLabelValue}>€{fmtN(lo)} – €{fmtN(hi)}</span>
                </div>
                <div className={styles.rangeWrap}>
                  <div className={styles.rangeTrack} />
                  <div className={styles.rangeFill} style={{ left: fillLeft, right: fillRight }} />
                  <input type="range" className="us-range" min={0} max={3000} step={50} value={minVal}
                    onChange={e => setMinVal(Math.min(+e.target.value, maxVal))} style={{ top: 0 }} />
                  <input type="range" className="us-range" min={0} max={3000} step={50} value={maxVal}
                    onChange={e => setMaxVal(Math.max(+e.target.value, minVal))} style={{ top: 0 }} />
                </div>
                <div className={styles.presets}>
                  {BUDGET_P.map(p => (
                    <button key={p.label} type="button" className={styles.preset}
                      onClick={() => { setMinVal(p.min); setMaxVal(p.max); }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* dates */}
              <div className={styles.mobileSheetSection}>
                <span className={styles.mobileSheetLabel}>When</span>
                <div className={styles.dateRow} style={{ marginTop: 12 }}>
                  <div className={styles.dateCol}>
                    <label className={styles.dateLabel}>Move-in</label>
                    <input type="date" className={styles.dateInput} value={moveIn} onChange={e => setMoveIn(e.target.value)} />
                  </div>
                  <div className={styles.dateCol}>
                    <label className={styles.dateLabel}>Move-out</label>
                    <input type="date" className={styles.dateInput} value={moveOut} onChange={e => setMoveOut(e.target.value)} />
                  </div>
                </div>
              </div>
              {/* type */}
              <div className={styles.mobileSheetSection}>
                <span className={styles.mobileSheetLabel}>Property type</span>
                <div className={styles.presets} style={{ marginTop: 12 }}>
                  {TYPES.map(t => (
                    <button key={t} type="button"
                      className={t === filterType ? styles.mobileTypeChipActive : styles.mobileTypeChip}
                      onClick={() => setFilterType(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {/* source */}
              <div className={styles.mobileSheetSection}>
                <span className={styles.mobileSheetLabel}>Listings</span>
                <div className={styles.presets} style={{ marginTop: 12 }}>
                  {SOURCES.map(s => (
                    <button key={s.k} type="button"
                      className={s.k === filterSource ? styles.mobileTypeChipActive : styles.mobileTypeChip}
                      onClick={() => setFilterSource(s.k)}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.mobileSheetFooter}>
              <button type="button" className={styles.mobileShowBtn} onClick={() => setMobileSheet(null)}>
                Show stays
              </button>
            </div>
          </div>
        )}

        {/* ── Sort sheet ── */}
        {mobileSheet === 'sort' && (
          <div className={styles.mobileSheetSort}>
            <div className={styles.mobileSheetHandle} />
            <div className={styles.mobileSheetHeader} style={{ border: 'none' }}>
              <span className={styles.mobileSheetTitle}>Sort by</span>
            </div>
            <div style={{ padding: '8px 12px 22px' }}>
              {SORTS.map(s => (
                <button key={s.k} type="button" className={styles.mobileSortOption}
                  onClick={() => { setFilterSort(s.k); setMobileSheet(null); }}>
                  <span style={{ color: s.k === filterSort ? '#6d28d9' : '#1c1530' }}>{s.l}</span>
                  {s.k === filterSort && <ICheck />}
                </button>
              ))}
            </div>
          </div>
        )}

        <MobileTabBar active="explore" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          DESKTOP LAYOUT (≥ 768px)
      ══════════════════════════════════════════════════════════ */}
      <div className={styles.desktopOnly}>

      {/* Backdrop */}
      {open !== null && <div className={styles.backdrop} onClick={() => setOpen(null)} />}

      {/* ══════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════ */}
      <AppNav centerSlot={
        <div className={styles.navSearchWrap}>
          <div className={styles.navSearchInner}>
            <span className={styles.navSearchIcon}><ISearch /></span>
            <input
              type="text"
              className={styles.navSearchInput}
              placeholder="Search city or university…"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen('search'); }}
              onFocus={() => setOpen('search')}
            />
            {query.trim().length > 0 && (
              <button type="button" className={styles.navSearchClear}
                onClick={() => { setQuery(''); setOpen('search'); }}>
                <IClose />
              </button>
            )}
          </div>

          {isOpen('search') && (
            <div className={styles.searchDropdown}>
              <div className={`us-scroll ${styles.searchDropdownScroll}`}>
                {groups.length === 0 ? (
                  <div className={styles.searchEmpty}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>No matches</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>Try a different city or university name.</div>
                  </div>
                ) : groups.map(group => (
                  <div key={group.title}>
                    <div className={styles.groupHeader}>
                      <span>{group.title}</span><span className={styles.groupLine} />
                    </div>
                    {group.items.map(item => (
                      <button key={item.name} type="button" className={styles.suggestRow}
                        onClick={() => {
                          selectCity(item.name, item.sub, item.kind);
                          setQuery(item.name); setOpen(null);
                        }}>
                        <span className={styles.suggestIcon} style={{
                          background: item.kind === 'uni' ? 'var(--tint-indigo)' : 'var(--tint)',
                          color:      item.kind === 'uni' ? 'var(--uni-accent)' : 'var(--brand)',
                        }}>
                          {item.kind === 'uni'    && <IUni />}
                          {item.kind === 'recent' && <IClock />}
                          {item.kind === 'city'   && <IPin />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className={styles.suggestName}>{item.name}</span>
                          <span className={styles.suggestSub}>{item.sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      } />

      {/* ══════════════════════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════════════════════ */}
      <div className={styles.main}>

        {/* ── Toolbar ── */}
        <div className={styles.toolbar}>

          {/* WHEN */}
          <div className={styles.pillWrap}>
            <button type="button" className={styles.pillDark} onClick={() => toggle('when')}>
              <ICal />
              {hasWhen ? `${fmtDate(moveIn)} – ${fmtDate(moveOut)}` : 'Add dates'}
              <IChevW open={isOpen('when')} />
            </button>
            {isOpen('when') && (
              <div className={styles.whenPanel}>
                <div className={styles.dateRow}>
                  <div className={styles.dateCol}>
                    <label className={styles.dateLabel}>Move-in</label>
                    <input type="date" className={styles.dateInput} value={moveIn} onChange={e => setMoveIn(e.target.value)} />
                  </div>
                  <div className={styles.dateCol}>
                    <label className={styles.dateLabel}>Move-out</label>
                    <input type="date" className={styles.dateInput} value={moveOut} onChange={e => setMoveOut(e.target.value)} />
                  </div>
                </div>
                <div className={styles.presets}>
                  {DURATION.map(d => (
                    <button key={d.label} type="button" className={styles.preset}
                      onClick={() => { setMoveIn(d.mi); setMoveOut(d.mo); }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PRICE */}
          <div className={styles.pillWrap}>
            <button type="button" className={pc('price', priceSet)} onClick={() => toggle('price')}>
              {budgetDefault ? 'Price' : `€${fmtN(lo)} – €${fmtN(hi)}`}
              <span className={styles.pillChev}><IChev open={isOpen('price')} /></span>
            </button>
            {isOpen('price') && (
              <div className={styles.pricePanel}>
                <div className={styles.priceHeader}>
                  <span className={styles.priceHeaderLabel}>Monthly rent</span>
                  <span className={styles.priceHeaderValue}>€{fmtN(lo)} – €{fmtN(hi)}</span>
                </div>
                <div className={styles.rangeWrap}>
                  <div className={styles.rangeTrack} />
                  <div className={styles.rangeFill} style={{ left: fillLeft, right: fillRight }} />
                  <input type="range" className="us-range" min={0} max={3000} step={50} value={minVal}
                    onChange={e => setMinVal(Math.min(+e.target.value, maxVal))} style={{ top: 0 }} />
                  <input type="range" className="us-range" min={0} max={3000} step={50} value={maxVal}
                    onChange={e => setMaxVal(Math.max(+e.target.value, minVal))} style={{ top: 0 }} />
                </div>
                <div className={styles.presets}>
                  {BUDGET_P.map(p => (
                    <button key={p.label} type="button" className={styles.preset}
                      onClick={() => { setMinVal(p.min); setMaxVal(p.max); }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PROPERTY TYPE */}
          <div className={styles.pillWrap}>
            <button type="button" className={pc('type', typeSet)} onClick={() => toggle('type')}>
              {typeSet ? filterType : 'Property type'}
              <span className={styles.pillChev}><IChev open={isOpen('type')} /></span>
            </button>
            {isOpen('type') && (
              <div className={styles.listPanel} style={{ width: 280 }}>
                {TYPES.map(t => (
                  <button key={t} type="button"
                    className={`${styles.listItem} ${t === filterType ? styles.listItemActive : ''}`}
                    onClick={() => { setFilterType(t); setOpen(null); }}>
                    <span style={{ color: t === filterType ? 'var(--brand)' : 'var(--text)' }}>{t}</span>
                    {t === filterType && <ICheck />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SOURCE */}
          <div className={styles.pillWrap}>
            <button type="button" className={pc('source', sourceSet)} onClick={() => toggle('source')}>
              {SOURCES.find(s => s.k === filterSource)!.l}
              <span className={styles.pillChev}><IChev open={isOpen('source')} /></span>
            </button>
            {isOpen('source') && (
              <div className={styles.listPanel} style={{ width: 240 }}>
                {SOURCES.map(s => (
                  <button key={s.k} type="button"
                    className={`${styles.listItem} ${s.k === filterSource ? styles.listItemActive : ''}`}
                    onClick={() => { setFilterSource(s.k); setOpen(null); }}>
                    <span style={{ color: s.k === filterSource ? 'var(--brand)' : 'var(--text)' }}>{s.l}</span>
                    {s.k === filterSource && <ICheck />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SORT */}
          <div className={styles.pillWrapRight}>
            <button type="button" className={pc('sort', sortSet)} onClick={() => toggle('sort')}>
              <ISort />
              {SORTS.find(s => s.k === filterSort)!.l}
              <span className={styles.pillChev}><IChev open={isOpen('sort')} /></span>
            </button>
            {isOpen('sort') && (
              <div className={styles.listPanel} style={{ width: 240, left: 'auto', right: 0 }}>
                {SORTS.map(s => (
                  <button key={s.k} type="button"
                    className={`${styles.listItem} ${s.k === filterSort ? styles.listItemActive : ''}`}
                    onClick={() => { setFilterSort(s.k); setOpen(null); }}>
                    <span style={{ color: s.k === filterSort ? 'var(--brand)' : 'var(--text)' }}>{s.l}</span>
                    {s.k === filterSort && <ICheck />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Results + Map ── */}
        <div className={styles.splitGrid}>

          {/* Results */}
          <div>
            <div className={styles.resultsHeader}>
              <span className={styles.resultCount}>{partnerTotal + filtered.filter(l => l.source === 'casa').length || filtered.length}</span>
              <span className={styles.resultSub}>
                properties{cityName ? ` in ${cityName}` : ''}
              </span>
            </div>

            {filtered.length > 0 ? (
              <div className={styles.cardsGrid}>
                {filtered.map((p, i) => {
                  const hue = PH_HUES[i % PH_HUES.length];
                  return (
                    <Link href={`/search/${p.id}`} key={p.id} className={styles.card} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {/* Image */}
                      <div
                        className={styles.cardImg}
                        style={p.coverPhoto ? { backgroundImage: `url(${p.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: `repeating-linear-gradient(135deg, ${hue.a} 0 15px, ${hue.b} 15px 30px)` }}
                      >
                        <span
                          className={styles.cardBadge}
                          style={{ background: p.badge === 'PARTNER' ? '#1c1530' : '#6d28d9' }}
                        >
                          {p.badge}
                        </span>
                        {!p.coverPhoto && <span className={styles.cardImgLabel}>[ photo ]</span>}
                      </div>

                      {/* Body */}
                      <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>{p.title}</h3>
                        <p className={styles.cardAddress}>{p.address}</p>

                        <div className={styles.cardMeta}>
                          <span className={styles.cardMetaItem}><IArea /> {p.area} m²</span>
                          <span className={styles.cardMetaItem}><IBed /> {p.beds}</span>
                        </div>

                        <div className={styles.cardFooter}>
                          <div>
                            <span className={styles.cardPrice}>€{fmtN(p.price)}</span>
                            <span className={styles.cardPriceUnit}> /month</span>
                            {p.incl && <div className={styles.cardIncl}>incl. utilities</div>}
                          </div>
                          <span className={styles.cardAvail} style={{ color: p.now ? '#1f8a5b' : '#9a94a8' }}>
                            <span className={styles.cardAvailDot} style={{ background: p.now ? '#27ae73' : '#cfc8dd' }} />
                            {p.avail}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>
                  <ISearch />
                </div>
                <div className={styles.noResultsTitle}>No places match your filters</div>
                <div className={styles.noResultsSub}>Try widening your budget or clearing a filter.</div>
                <button type="button" className={styles.resetBtn} onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            )}
            {hasMore && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={() => setPage(p => p + 1)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div className={styles.mapPanelWrap}>
            <MapPanel properties={mapProps} />
          </div>
        </div>
      </div>
      </div>{/* end desktopOnly */}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
