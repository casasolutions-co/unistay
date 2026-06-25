'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './MobileHeroSection.module.css';
import { useCitySearch } from '@/lib/useCitySearch';
import MobileTabBar from './MobileTabBar';

const POPULAR_CITIES = ['Berlin', 'Munich', 'Hamburg', 'Frankfurt am Main', 'Köln', 'Stuttgart'];
const TYPES = ['Any type', 'Studio', 'Shared flat (WG)', '1-bedroom apartment', '2+ bedrooms'];
const MAX_RENT_OPTS = ['Any budget', '€500', '€800', '€1,200', '€2,000'];

/* ── Icons ──────────────────────────────────────────────────── */
function IconSearch() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
    </svg>
  );
}
function IconChevron({ rotated }: { rotated?: boolean }) {
  return (
    <span className={styles.chevron} style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconUni() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────────── */
export default function MobileHeroSection() {
  const router = useRouter();
  const { query, setQuery, groups, selectCity } = useCitySearch();
  const [location, setLocation] = useState('');
  const [openWhere, setOpenWhere] = useState(false);
  const [moveIn, setMoveIn] = useState('2026-06-23');
  const [moveOut, setMoveOut] = useState('2026-07-01');
  const [type, setType] = useState('Any type');
  const [maxRent, setMaxRent] = useState('Any budget');
  const [customRent, setCustomRent] = useState('');
  const [openType, setOpenType] = useState(false);
  const [openRent, setOpenRent] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOpenWhere(false);
        setOpenType(false);
        setOpenRent(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setNavOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function selectLocation(name: string, sub = 'Germany', kind: 'recent' | 'city' | 'uni' = 'city') {
    selectCity(name, sub, kind);
    setLocation(name);
    setQuery('');
    setOpenWhere(false);
  }

  return (
    <div className={styles.wrapper}>

      {/* ── Hero: gradient bg + overlaid nav + headline ── */}
      <div className={styles.hero}>
        <div className={styles.heroGradient} />

        {/* Nav overlaid on hero */}
        <div className={styles.nav} ref={navRef}>
          <div className={styles.navBrand}>
            <Image src="/primary-logo.png" alt="UniStay" width={2049} height={1772} style={{ height: 40, width: 'auto', filter: 'brightness(0) invert(1)' }} priority />
          </div>
          <button
            type="button"
            className={styles.hamburger}
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setNavOpen(p => !p)}
          >
            {navOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          {navOpen && (
            <div className={styles.navMenu}>
              <a href="/search" className={styles.navMenuLink}>View Listings</a>
              <div className={styles.navMenuDivider} />
              <a href="/login" className={styles.navMenuLoginBtn}>Login / Register</a>
            </div>
          )}
        </div>

        {/* Headline */}
        <div className={styles.headline}>
          <p className={styles.eyebrow}>The best way to</p>
          <h1 className={styles.h1}>Find your happy place</h1>
          <p className={styles.subline}>Search student flats for rent in Germany</p>
        </div>
      </div>

      {/* ── Search card (overlaps hero bottom) ── */}
      <div className={styles.searchCard} ref={cardRef}>

        {/* Where */}
        <label className={styles.fieldLabel}>Where</label>
        <div className={styles.whereWrap}>
          <span className={styles.inputIcon}><IconSearch /></span>
          <input
            type="text"
            placeholder={location || 'City or university…'}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpenWhere(true); }}
            onFocus={() => setOpenWhere(true)}
            className={styles.textInput}
          />
          {location && !query && (
            <button
              type="button"
              className={styles.whereClear}
              onClick={() => { setLocation(''); setQuery(''); }}
              aria-label="Clear"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          )}

          {/* Where dropdown */}
          {openWhere && (
            <div className={styles.whereDropdown}>
              {groups.length === 0 ? (
                <div className={styles.whereEmpty}>
                  <span className={styles.whereEmptyTitle}>No matches</span>
                  <span className={styles.whereEmptySub}>Try a different city or university.</span>
                </div>
              ) : groups.map(group => (
                <div key={group.title}>
                  <div className={styles.whereGroupHeader}>{group.title}</div>
                  {group.items.map(item => (
                    <button
                      key={item.name}
                      type="button"
                      className={styles.whereRow}
                      onMouseDown={e => { e.preventDefault(); selectLocation(item.name, item.sub, item.kind); }}
                    >
                      <span
                        className={styles.whereIconTile}
                        style={{
                          background: item.kind === 'uni' ? 'var(--tint-indigo)' : 'var(--tint)',
                          color: item.kind === 'uni' ? 'var(--uni-accent)' : 'var(--brand)',
                        }}
                      >
                        {item.kind === 'uni' && <IconUni />}
                        {item.kind === 'recent' && <IconClock />}
                        {item.kind === 'city' && <IconPin />}
                      </span>
                      <span className={styles.whereRowText}>
                        <span className={styles.whereRowName}>{item.name}</span>
                        <span className={styles.whereRowSub}>{item.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Type + Max rent — custom dropdowns */}
        <div className={styles.row2}>
          {/* TYPE */}
          <div className={styles.dropdownWrap}>
            <label className={styles.fieldLabel}>Type</label>
            <button
              type="button"
              className={styles.dropdownTrigger}
              style={{ background: openType ? 'var(--tint-hover)' : 'var(--page)' }}
              onClick={() => { setOpenType(p => !p); setOpenRent(false); setOpenWhere(false); }}
            >
              <span className={styles.dropdownTriggerText}>{type}</span>
              <IconChevron rotated={openType} />
            </button>
            {openType && (
              <div className={styles.dropdownPanel}>
                {TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={styles.dropdownOption}
                    style={{ background: t === type ? 'var(--tint)' : 'transparent' }}
                    onClick={() => { setType(t); setOpenType(false); }}
                  >
                    <span style={{ color: t === type ? 'var(--brand)' : 'var(--text)' }}>{t}</span>
                    {t === type && <IconCheck />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MAX RENT */}
          <div className={styles.dropdownWrap}>
            <label className={styles.fieldLabel}>Max rent</label>
            <button
              type="button"
              className={styles.dropdownTrigger}
              style={{ background: openRent ? 'var(--tint-hover)' : 'var(--page)' }}
              onClick={() => { setOpenRent(p => !p); setOpenType(false); setOpenWhere(false); }}
            >
              <span className={styles.dropdownTriggerText}>{maxRent}</span>
              <IconChevron rotated={openRent} />
            </button>
            {openRent && (
              <div className={styles.dropdownPanel}>
                {/* Custom amount input */}
                <div className={styles.rentInputWrap}>
                  <span className={styles.rentInputPrefix}>€</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Enter amount…"
                    value={customRent}
                    onChange={e => {
                      setCustomRent(e.target.value);
                      if (e.target.value) setMaxRent('€' + e.target.value);
                      else setMaxRent('Any budget');
                    }}
                    className={styles.rentInput}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className={styles.rentDivider} />
                {MAX_RENT_OPTS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={styles.dropdownOption}
                    style={{ background: opt === maxRent ? 'var(--tint)' : 'transparent' }}
                    onClick={() => { setMaxRent(opt); setCustomRent(''); setOpenRent(false); }}
                  >
                    <span style={{ color: opt === maxRent ? 'var(--brand)' : 'var(--text)' }}>{opt}</span>
                    {opt === maxRent && <IconCheck />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className={styles.row2} style={{ marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Move-in</label>
            <input type="date" value={moveIn} onChange={e => setMoveIn(e.target.value)} className={styles.dateInput} />
          </div>
          <div style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Move-out</label>
            <input type="date" value={moveOut} onChange={e => setMoveOut(e.target.value)} className={styles.dateInput} />
          </div>
        </div>

        {/* Search button */}
        <button
          type="button"
          className={styles.searchBtn}
          onClick={() => {
            const params = new URLSearchParams();
            if (location) params.set('location', location);
            if (type !== 'Any type') params.set('type', type);
            if (maxRent !== 'Any budget') params.set('maxRent', maxRent);
            if (moveIn) params.set('moveIn', moveIn);
            if (moveOut) params.set('moveOut', moveOut);
            router.push(`/search?${params.toString()}`);
          }}
        >
          <IconSearch />
          Search flats
        </button>
      </div>

      {/* ── Popular cities ── */}
      <div className={styles.popularWrap}>
        <div className={styles.popularLabel}>Popular cities</div>
        <div className={styles.popularScroll}>
          {POPULAR_CITIES.map(city => (
            <button key={city} type="button" className={styles.cityChip} onClick={() => selectLocation(city, 'Germany', 'city')}>
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* ── Trust strip ── */}
      <div className={styles.trustStrip}>
        <div>
          <div className={styles.trustRatingRow}>
            <span className={styles.trustStars}>★★★★★</span>
            <span className={styles.trustScore}>4.8</span>
          </div>
          <div className={styles.trustSub}>147 reviews · Trustpilot</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.trustCount}>1200+</div>
          <div className={styles.trustSub}>students trust us</div>
        </div>
      </div>

      <MobileTabBar active="explore" />
    </div>
  );
}
