'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './HeroSection.module.css';
import MobileHeroSection from './MobileHeroSection';
import { useCitySearch } from '@/lib/useCitySearch';

const TYPES = ['Any type', 'Studio', 'Shared flat (WG)', '1-bedroom apartment', '2+ bedrooms'];
const POPULAR_CITIES = ['Berlin', 'Munich', 'Hamburg', 'Frankfurt am Main', 'Köln', 'Stuttgart'];
const AVATAR_SHIFTS = ['0px', '-9px', '-9px', '-9px', '-9px'];

/* ── Icon components ────────────────────────────────────────────── */
function IconHome() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.2 12 4l9 7.2" /><path d="M5.5 9.8V20h13V9.8" /><path d="M10 20v-5h4v5" />
    </svg>
  );
}
function IconSearch({ color = '#b0aabf', size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
    </svg>
  );
}
function IconChevron({ color = '#6d28d9', rotated = false }: { color?: string; rotated?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', transition: 'transform .18s', transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}
function IconPin({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconUni({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
    </svg>
  );
}
function IconClock({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */
function fmtDate(s: string): string {
  if (!s) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = s.split('-');
  if (parts.length !== 3) return '';
  return parseInt(parts[2], 10) + ' ' + months[parseInt(parts[1], 10) - 1];
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function HeroSection() {
  const router = useRouter();
  const [open, setOpen] = useState<'where' | 'type' | 'budget' | 'when' | null>(null);
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Any type');
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(3000);
  const [moveIn, setMoveIn] = useState('2026-06-23');
  const [moveOut, setMoveOut] = useState('2026-07-01');
  const { query, setQuery, groups, selectCity } = useCitySearch();

  const toggle = useCallback((name: 'where' | 'type' | 'budget' | 'when') => {
    setOpen(prev => prev === name ? null : name);
  }, []);

  const handleSearch = useCallback(() => {
    setOpen(null);
    const params = new URLSearchParams();
    const city = location.trim() || query.trim();
    if (city) params.set('city', city);
    if (type !== 'Any type') params.set('type', type);
    if (minVal > 0) params.set('minPrice', String(minVal));
    if (maxVal < 3000) params.set('maxPrice', String(maxVal));
    if (moveIn) params.set('moveIn', moveIn);
    if (moveOut) params.set('moveOut', moveOut);
    router.push(`/search?${params.toString()}`);
  }, [router, location, query, type, minVal, maxVal, moveIn, moveOut]);

  // close on outside click
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);


  /* BUDGET */
  const lo = Math.min(minVal, maxVal);
  const hi = Math.max(minVal, maxVal);
  const budgetDefault = lo === 0 && hi === 3000;
  const fmtN = (n: number) => n.toLocaleString('en-US');
  const fillLeft = (lo / 3000 * 100).toFixed(2) + '%';
  const fillRight = (100 - hi / 3000 * 100).toFixed(2) + '%';

  /* WHEN */
  const hasWhen = moveIn && moveOut;
  const whenText = hasWhen ? fmtDate(moveIn) + ' – ' + fmtDate(moveOut) : 'Add dates';

  return (
    <>
      {/* Mobile layout — shown only on mobile via CSS */}
      <div className={styles.mobileOnly}>
        <MobileHeroSection />
      </div>

      {/* Desktop layout */}
      <section className={`${styles.section} ${styles.desktopOnly}`}>
      {/* ── Hero Image + Headline ── */}
      <div className={styles.heroImgWrap}>
        <div className={styles.heroGradient} />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>The best way to</p>
            <h1 className={styles.headline}>Find your happy place</h1>
            <p className={styles.subline}>UniStay: Search student flats for rent in Germany</p>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className={styles.searchWrap} ref={barRef}>
        <div className={styles.searchBar}>

          {/* WHERE */}
          <div className={styles.segment} style={{ flex: '2.2' }}>
            {open === 'where' ? (
              /* Active: segment becomes a live input */
              <div
                className={styles.segmentBtn}
                style={{ background: 'var(--tint-hover)', cursor: 'text' }}
              >
                <div className={styles.segmentLabel}>Where</div>
                <div className={styles.segmentValue}>
                  <IconSearch color="#6d28d9" />
                  <input
                    type="text"
                    placeholder="Search city or university…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className={styles.inlineInput}
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              /* Inactive: clickable button */
              <button
                id="where-trigger"
                type="button"
                className={styles.segmentBtn}
                style={{ background: 'transparent' }}
                onClick={() => toggle('where')}
              >
                <div className={styles.segmentLabel}>Where</div>
                <div className={styles.segmentValue}>
                  <IconSearch color="#b0aabf" />
                  <span style={{ color: location ? 'var(--text)' : 'var(--placeholder)' }}>
                    {location || 'Search city or university…'}
                  </span>
                </div>
              </button>
            )}

            {open === 'where' && (
              <div className={styles.dropdown} style={{ width: 420, left: 0 }}>
                {/* Results list only — no duplicate input */}
                <div className={`us-scroll ${styles.dropdownList}`}>
                  {groups.length === 0 ? (
                    <div className={styles.emptyResults}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>No matches</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>Try a different name.</div>
                    </div>
                  ) : groups.map(group => (
                    <div key={group.title}>
                      <div className={styles.groupHeader}>
                        <span>{group.title}</span>
                        <span className={styles.groupLine} />
                      </div>
                      {group.items.map(item => (
                        <button
                          key={item.name}
                          type="button"
                          className={styles.dropdownRow}
                          onClick={() => {
                            selectCity(item.name, item.sub, item.kind);
                            setLocation(item.name); setQuery(''); setOpen(null);
                          }}
                        >
                          <span
                            className={styles.iconTile}
                            style={{
                              background: item.kind === 'uni' ? 'var(--tint-indigo)' : 'var(--tint)',
                              color: item.kind === 'uni' ? 'var(--uni-accent)' : 'var(--brand)',
                            }}
                          >
                            {item.kind === 'uni' && <IconUni />}
                            {item.kind === 'recent' && <IconClock />}
                            {item.kind === 'city' && <IconPin />}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className={styles.rowName}>{item.name}</span>
                            <span className={styles.rowSub}>{item.sub}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* TYPE */}
          <div className={styles.segment} style={{ flex: '1.25' }}>
            <button
              id="type-trigger"
              type="button"
              className={styles.segmentBtn}
              style={{ background: open === 'type' ? 'var(--tint-hover)' : 'transparent' }}
              onClick={() => toggle('type')}
            >
              <div className={styles.segmentLabel}>Type</div>
              <div className={styles.segmentValueRow}>
                <span style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>{type}</span>
                <IconChevron rotated={open === 'type'} />
              </div>
            </button>

            {open === 'type' && (
              <div className={styles.dropdown} style={{ width: 290, left: 0 }}>
                {TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={styles.dropdownRow}
                    style={{ background: t === type ? 'var(--tint)' : 'transparent', justifyContent: 'space-between' }}
                    onClick={() => { setType(t); setOpen(null); }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: t === type ? 'var(--brand)' : 'var(--text)' }}>{t}</span>
                    {t === type && <IconCheck />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* BUDGET */}
          <div className={styles.segment} style={{ flex: '1.25' }}>
            <button
              id="budget-trigger"
              type="button"
              className={styles.segmentBtn}
              style={{ background: open === 'budget' ? 'var(--tint-hover)' : 'transparent' }}
              onClick={() => toggle('budget')}
            >
              <div className={styles.segmentLabel}>Budget</div>
              <div className={styles.segmentValueRow}>
                <span style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>
                  {budgetDefault ? 'Any budget' : `€${fmtN(lo)} – €${fmtN(hi)}`}
                </span>
                <IconChevron rotated={open === 'budget'} />
              </div>
            </button>

            {open === 'budget' && (
              <div className={styles.dropdown} style={{ width: 360, right: 0, left: 'auto', padding: 20 }}>
                <div className={styles.budgetHeader}>
                  <span className={styles.budgetHeaderLabel}>Monthly rent</span>
                  <span className={styles.budgetHeaderValue}>€{fmtN(lo)} – €{fmtN(hi)}</span>
                </div>
                {/* Range slider */}
                <div style={{ position: 'relative', height: 26, marginBottom: 18 }}>
                  <div className={styles.rangeTrack} />
                  <div
                    className={styles.rangeFill}
                    style={{ left: fillLeft, right: fillRight }}
                  />
                  <input
                    type="range"
                    className="us-range"
                    min={0} max={3000} step={50}
                    value={minVal}
                    onChange={e => setMinVal(Math.min(+e.target.value, maxVal))}
                    style={{ top: 0 }}
                  />
                  <input
                    type="range"
                    className="us-range"
                    min={0} max={3000} step={50}
                    value={maxVal}
                    onChange={e => setMaxVal(Math.max(+e.target.value, minVal))}
                    style={{ top: 0 }}
                  />
                </div>
                {/* Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {[
                    { label: 'Any', min: 0, max: 3000 },
                    { label: '≤ €500', min: 0, max: 500 },
                    { label: '≤ €800', min: 0, max: 800 },
                    { label: '≤ €1,200', min: 0, max: 1200 },
                    { label: '≤ €2,000', min: 0, max: 2000 },
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      className={styles.chip}
                      onClick={() => { setMinVal(p.min); setMaxVal(p.max); }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* WHEN */}
          <div className={styles.segment} style={{ flex: '1.5' }}>
            <button
              id="when-trigger"
              type="button"
              className={styles.segmentBtn}
              style={{ background: open === 'when' ? 'var(--tint-hover)' : 'transparent' }}
              onClick={() => toggle('when')}
            >
              <div className={styles.segmentLabel}>When</div>
              <div className={styles.segmentValueRow}>
                <span style={{ color: hasWhen ? 'var(--text)' : 'var(--placeholder)', fontSize: 15, fontWeight: 600 }}>
                  {whenText}
                </span>
                <IconChevron rotated={open === 'when'} />
              </div>
            </button>

            {open === 'when' && (
              <div className={styles.dropdown} style={{ width: 360, right: 0, left: 'auto', padding: 20 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label className={styles.dateLabel}>Move-in</label>
                    <input
                      type="date"
                      value={moveIn}
                      onChange={e => setMoveIn(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className={styles.dateLabel}>Move-out</label>
                    <input
                      type="date"
                      value={moveOut}
                      onChange={e => setMoveOut(e.target.value)}
                      className={styles.dateInput}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {[
                    { label: 'This month', mi: '2026-06-23', mo: '2026-07-23' },
                    { label: 'Next semester', mi: '2026-10-01', mo: '2027-03-31' },
                    { label: 'Full year', mi: '2026-10-01', mo: '2027-09-30' },
                  ].map(d => (
                    <button
                      key={d.label}
                      type="button"
                      className={styles.chip}
                      onClick={() => { setMoveIn(d.mi); setMoveOut(d.mo); }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEARCH BUTTON */}
          <button
            id="search-submit"
            type="button"
            className={styles.searchBtn}
            onClick={handleSearch}
          >
            <IconSearch color="#fff" size={18} />
            Search
          </button>
        </div>

        {/* Popular city chips */}
        <div className={styles.chipsRow}>
          <span className={styles.chipsLabel}>Popular:</span>
          {POPULAR_CITIES.map(city => (
            <button
              key={city}
              type="button"
              className={styles.chip}
              onClick={() => { selectCity(city, 'Germany', 'city'); setLocation(city); setOpen(null); }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}
