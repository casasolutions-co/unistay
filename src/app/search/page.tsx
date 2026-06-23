'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './page.module.css';
import type { MapProperty } from './MapPanel';
import { PROPERTIES } from '../data/properties';

const MapPanel = dynamic(() => import('./MapPanel'), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const RECENT = [
  { name: 'Neumarkt in der Oberpfalz', sub: 'Germany' },
  { name: 'Düsseldorf', sub: 'Germany' },
  { name: 'Berlin', sub: 'Germany' },
];
const CITIES = [
  { name: 'Berlin', sub: 'Germany' },
  { name: 'Munich', sub: 'Germany' },
  { name: 'Hamburg', sub: 'Germany' },
  { name: 'Frankfurt', sub: 'Germany' },
  { name: 'Cologne', sub: 'Germany' },
  { name: 'Stuttgart', sub: 'Germany' },
];
const UNIS = [
  { name: 'Technical University of Munich', sub: 'Munich, Germany' },
  { name: 'Ludwig-Maximilians-Universität München', sub: 'Munich, Germany' },
  { name: 'University of Seville', sub: 'Seville, Spain' },
  { name: 'Sapienza Università di Roma', sub: 'Rome, Italy' },
  { name: 'University of Amsterdam', sub: 'Amsterdam, Netherlands' },
];

// Properties are now imported from ../data/properties

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

const MENU_ITEMS = [
  { label: 'My profile',       iconPath: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' },
  { label: 'Saved homes',      iconPath: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z' },
  { label: 'My applications',  iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4' },
  { label: 'Messages', badge: '3', iconPath: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { label: 'Settings',         iconPath: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
type OpenPanel = 'search' | 'avatar' | 'when' | 'price' | 'type' | 'source' | 'sort' | null;

function fmtN(n: number) { return n.toLocaleString('en-US'); }

function fmtDate(s: string) {
  if (!s) return '';
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const p = s.split('-');
  return parseInt(p[2], 10) + ' ' + M[parseInt(p[1], 10) - 1];
}

function buildGroups(query: string) {
  const q = query.trim().toLowerCase();
  const hasQ = q.length > 0;
  const match = (it: { name: string; sub: string }) =>
    !hasQ || (it.name + ' ' + it.sub).toLowerCase().includes(q);
  const groups: { title: string; items: { name: string; sub: string; kind: 'recent' | 'city' | 'uni' }[] }[] = [];
  if (!hasQ) groups.push({ title: 'Your recent searches', items: RECENT.map(it => ({ ...it, kind: 'recent' as const })) });
  const c = CITIES.filter(match);
  if (c.length) groups.push({ title: 'Popular cities', items: c.map(it => ({ ...it, kind: 'city' as const })) });
  const u = UNIS.filter(match);
  if (u.length) groups.push({ title: 'Popular universities', items: u.map(it => ({ ...it, kind: 'uni' as const })) });
  return groups;
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
const ITabHome = ({ active }: { active: boolean }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5h4v5"/></svg>;
const ITabSearch = ({ active }: { active: boolean }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>;
const ITabHeart = ({ active }: { active: boolean }) => <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>;
const ITabMsg = ({ active }: { active: boolean }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const ITabUser = ({ active }: { active: boolean }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
const IChev   = ({ open }: { open: boolean }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="m6 9 6 6 6-6"/></svg>;
const IChevW  = ({ open }: { open: boolean }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="m6 9 6 6 6-6"/></svg>;
const IChevG  = ({ open }: { open: boolean }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a8499" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="m6 9 6 6 6-6"/></svg>;
const ICheck  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
const ICal    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>;
const ISort   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h13M3 12h9M3 18h5M18 9l3-3-3-3M21 6v12"/></svg>;
const IUni    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5"/></svg>;
const IClock  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
const IPin    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IBell   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>;
const IPlus   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const ILogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
const IArea   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0aabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3 3 21M9 3H3v6M21 15v6h-6"/></svg>;
const IBed    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0aabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 11h20M2 11V6a2 2 0 0 1 2-2h6v7M22 11v6M2 17h20M4 20v-3M20 20v-3"/></svg>;
function MenuIcon({ path }: { path: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>;
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
function initials(user: User | null) {
  if (!user) return '??';
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

export default function SearchPage() {
  const [authUser, setAuthUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setAuthUser);
  }, []);

  /* ── Panel state ── */
  const [open, setOpen]       = useState<OpenPanel>(null);
  const toggle = useCallback((name: OpenPanel) => setOpen(o => o === name ? null : name), []);
  const isOpen = (name: OpenPanel) => open === name;

  /* ── Nav search ── */
  const [query, setQuery]     = useState('Munich');
  const navRef                = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  /* ── Mobile state ── */
  const [mobileSheet,     setMobileSheet]     = useState<'filters' | 'sort' | null>(null);
  const [mobileMapOpen,   setMobileMapOpen]   = useState(false);
  const [mobileSaved,     setMobileSaved]     = useState<Record<string, boolean>>({});
  const [mobileActiveTab, setMobileActiveTab] = useState('search');

  /* ── Filter state ── */
  const [filterType,   setFilterType]   = useState('Any type');
  const [filterSource, setFilterSource] = useState('all');
  const [filterSort,   setFilterSort]   = useState('featured');
  const [minVal,       setMinVal]       = useState(0);
  const [maxVal,       setMaxVal]       = useState(3000);
  const [moveIn,       setMoveIn]       = useState('2026-06-23');
  const [moveOut,      setMoveOut]      = useState('2026-07-01');

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

  /* ── Filter + sort properties ── */
  const q = query.trim().toLowerCase();
  let filtered = PROPERTIES.filter(p => {
    if (q && !(p.title + ' ' + p.address + ' ' + p.city).toLowerCase().includes(q)) return false;
    if (typeSet   && p.type  !== filterType)  return false;
    if (sourceSet && p.badge !== filterSource) return false;
    if (p.price < lo || p.price > hi)         return false;
    return true;
  });
  if      (filterSort === 'price_asc')  filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (filterSort === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (filterSort === 'area_desc')  filtered = [...filtered].sort((a, b) => b.area  - a.area);
  else                                  filtered = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const mapProps: MapProperty[] = filtered.map(p => ({
    title: p.title, address: p.address, price: p.price,
    featured: p.featured, lat: p.lat,   lng: p.lng,
    now: p.now,           avail: p.avail,
  }));


  const cityName = query.trim();
  const groups   = buildGroups(query);

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
                      onClick={() => { setQuery(item.name); setOpen(null); }}>
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
              <span className={styles.mobileResultCount}>{filtered.length}</span>
              <span className={styles.mobileResultSub}>stays{cityName ? ` in ${cityName}` : ''}</span>
            </div>
            <button type="button" className={styles.mobileSortBtn} onClick={() => setMobileSheet('sort')}>
              <ISort />
              {SORTS.find(s => s.k === filterSort)!.l}
            </button>
          </div>

          {/* cards */}
          {filtered.length > 0 ? (
            <div className={styles.mobileCards}>
              {filtered.map((p, i) => {
                const hue = PH_HUES[i % PH_HUES.length];
                const saved = mobileSaved[p.id] || false;
                return (
                  <div key={p.id} className={styles.mobileCard}>
                    <Link href={`/search/${p.id}`} className={styles.mobileCardLink}>
                      <div className={styles.mobileCardImg}
                        style={{ background: `repeating-linear-gradient(135deg, ${hue.a} 0 15px, ${hue.b} 15px 30px)` }}>
                        <span className={styles.mobileCardBadge}
                          style={{ background: p.badge === 'PARTNER' ? '#1c1530' : '#6d28d9' }}>
                          {p.badge}
                        </span>
                        <span className={styles.mobileCardImgLabel}>[ photo ]</span>
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

          <div style={{ height: 90 }} />
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
            <div className={styles.mobileMapBg} />
            <div className={styles.mobileMapWater1} />
            <div className={styles.mobileMapWater2} />
            {filtered.slice(0, 6).map((p, i) => {
              const positions = [
                { top: '24%', left: '34%' }, { top: '20%', left: '52%' },
                { top: '38%', left: '26%' }, { top: '44%', left: '46%' },
                { top: '56%', left: '34%' }, { top: '64%', left: '50%' },
              ];
              const pos = positions[i] || { top: `${30 + i * 10}%`, left: `${30 + i * 8}%` };
              return (
                <span key={p.id} className={styles.mobileMapPin}
                  style={{ top: pos.top, left: pos.left,
                    background: p.featured ? '#6d28d9' : '#fff',
                    color: p.featured ? '#fff' : '#1c1530',
                    border: p.featured ? '1.5px solid #fff' : '1.5px solid #6d28d9',
                  }}>
                  €{fmtN(p.price)}
                </span>
              );
            })}
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
                Show {filtered.length} stays
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

        {/* ── Bottom tab bar ── */}
        <div className={styles.mobileTabBar}>
          {[
            { key: 'home',     label: 'Home',     icon: (a: boolean) => <ITabHome   active={a} /> },
            { key: 'search',   label: 'Search',   icon: (a: boolean) => <ITabSearch active={a} /> },
            { key: 'saved',    label: 'Saved',    icon: (a: boolean) => <ITabHeart  active={a} /> },
            { key: 'messages', label: 'Messages', icon: (a: boolean) => <ITabMsg    active={a} />, badge: '3' },
            { key: 'profile',  label: 'Profile',  icon: (a: boolean) => <ITabUser   active={a} /> },
          ].map(tab => {
            const active = mobileActiveTab === tab.key;
            return (
              <button key={tab.key} type="button" className={styles.mobileTab}
                style={{ color: active ? '#6d28d9' : '#9a94a8' }}
                onClick={() => setMobileActiveTab(tab.key)}>
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  {tab.icon(active)}
                  {tab.badge && (
                    <span className={styles.mobileTabBadge}>{tab.badge}</span>
                  )}
                </span>
                <span className={styles.mobileTabLabel} style={{ fontWeight: active ? 700 : 500 }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
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
      <nav className={styles.nav} ref={navRef}>

        {/* Brand */}
        <a href="/" className={styles.brand}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11.2 12 4l9 7.2"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5h4v5"/>
          </svg>
          <span className={styles.wordmark}>UniStay</span>
        </a>

        {/* Search */}
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
                        onClick={() => { setQuery(item.name); setOpen(null); }}>
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

        {/* Right */}
        <div className={styles.navRight}>
          <a href="#" className={styles.navExplore}>Explore</a>

          <button type="button" className={styles.navListBtn}>
            <IPlus /> List your place
          </button>

          <button type="button" className={styles.bellBtn}>
            <IBell /><span className={styles.bellDot} />
          </button>

          {/* Avatar */}
          <div className={styles.avatarWrap}>
            <button type="button"
              className={`${styles.avatarBtn} ${isOpen('avatar') ? styles.avatarBtnOpen : ''}`}
              onClick={() => toggle('avatar')}>
              <span className={styles.avatarInitials}>{initials(authUser)}</span>
              <span className={styles.avatarChevron}><IChevG open={isOpen('avatar')} /></span>
            </button>

            {isOpen('avatar') && (
              <div className={styles.avatarDropdown}>
                <div className={styles.avatarProfile}>
                  <span className={styles.avatarProfileInitials}>{initials(authUser)}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className={styles.avatarProfileName}>{authUser?.displayName ?? authUser?.email?.split('@')[0] ?? 'Account'}</span>
                    <span className={styles.avatarProfileEmail}>{authUser?.email ?? ''}</span>
                  </span>
                </div>
                <div className={styles.avatarDivider} />
                {MENU_ITEMS.map(item => (
                  <button key={item.label} type="button" className={styles.menuItem} onClick={() => setOpen(null)}>
                    <span className={styles.menuItemIcon}><MenuIcon path={item.iconPath} /></span>
                    <span className={styles.menuItemLabel}>{item.label}</span>
                    {item.badge && <span className={styles.menuItemBadge}>{item.badge}</span>}
                  </button>
                ))}
                <div className={styles.avatarDivider} style={{ marginTop: 6 }} />
                <button type="button" className={styles.menuLogout} onClick={() => setOpen(null)}>
                  <span className={styles.menuLogoutIcon}><ILogout /></span>
                  <span className={styles.menuLogoutLabel}>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

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
              <span className={styles.resultCount}>{filtered.length}</span>
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
                        style={{ background: `repeating-linear-gradient(135deg, ${hue.a} 0 15px, ${hue.b} 15px 30px)` }}
                      >
                        <span
                          className={styles.cardBadge}
                          style={{ background: p.badge === 'PARTNER' ? '#1c1530' : '#6d28d9' }}
                        >
                          {p.badge}
                        </span>
                        <span className={styles.cardImgLabel}>[ photo ]</span>
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
