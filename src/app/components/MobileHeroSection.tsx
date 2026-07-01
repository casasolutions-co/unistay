'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './MobileHeroSection.module.css';
import { useCitySearch } from '@/lib/useCitySearch';
import MobileTabBar from './MobileTabBar';

const TYPES = ['Any type', 'Studio', 'Shared flat (WG)', '1-bedroom apartment', '2+ bedrooms'];
const MAX_RENT_OPTS = ['Any budget', '€500', '€800', '€1,200', '€2,000'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FLEX_OPTS = [
  { key: 'exact', label: 'Exact dates' },
  { key: '1week', label: '± 1 week' },
  { key: '2weeks', label: '± 2 weeks' },
] as const;

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }
function todayStr() {
  const t = new Date();
  return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
}
function currentMonthKey() {
  const t = new Date();
  return t.getFullYear() + '-' + pad(t.getMonth() + 1);
}
function fmtNice(ds: string) {
  if (!ds) return '';
  const p = ds.split('-');
  return parseInt(p[2], 10) + ' ' + ABBR[parseInt(p[1], 10) - 1] + ' ' + p[0];
}
function monthOptionsList() {
  const t = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < 15; i++) {
    let m = t.getMonth() + i;
    const y = t.getFullYear() + Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    opts.push({ value: y + '-' + pad(m + 1), label: MONTH_NAMES[m] + ' ' + y });
  }
  return opts;
}

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
  const [type, setType] = useState('Any type');
  const [maxRent, setMaxRent] = useState('Any budget');
  const [customRent, setCustomRent] = useState('');
  const [openType, setOpenType] = useState(false);
  const [openRent, setOpenRent] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const [openWhen, setOpenWhen] = useState(false);
  const [mode, setMode] = useState<'date' | 'month'>('date');
  const [moveIn, setMoveIn] = useState('');
  const [moveOut, setMoveOut] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [flex, setFlex] = useState<'exact' | '1week' | '2weeks'>('exact');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [stayMonths, setStayMonths] = useState(3);

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

  const monthOptions = monthOptionsList();
  const selMonth = monthOptions.find(m => m.value === selectedMonth);
  const hasMoveIn = !!moveIn;
  const hasMoveOut = !!moveOut && !noEndDate;

  const dateValueText = !hasMoveIn ? 'Add dates'
    : noEndDate ? 'From ' + fmtNice(moveIn) + ' · No end date'
    : hasMoveOut ? fmtNice(moveIn) + ' – ' + fmtNice(moveOut)
    : fmtNice(moveIn) + ' · Add move-out';
  const monthValueText = selMonth ? selMonth.label + ' · ' + stayMonths + (stayMonths === 1 ? ' month' : ' months') : 'Choose a month';

  const whenTriggerText = mode === 'date' ? dateValueText : monthValueText;
  const whenTriggerMuted = mode === 'date' ? !hasMoveIn : !selMonth;

  function handleMoveInChange(v: string) {
    setMoveIn(v);
    if (moveOut && moveOut < v) setMoveOut('');
  }

  function handleClearWhen() {
    setMoveIn(''); setMoveOut(''); setNoEndDate(false);
    setFlex('exact'); setSelectedMonth(currentMonthKey());
    setStayMonths(3);
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

        {/* When */}
        <div style={{ marginBottom: 18 }}>
          <label className={styles.fieldLabel}>When</label>
          <button type="button" className={styles.whenTrigger} onClick={() => setOpenWhen(true)}>
            <span className={styles.whenTriggerIcon}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18" /><path d="M8 3v4M16 3v4" />
              </svg>
            </span>
            <span className={styles.whenTriggerText} style={{ color: whenTriggerMuted ? 'var(--placeholder)' : 'var(--text)' }}>
              {whenTriggerText}
            </span>
            <IconChevron />
          </button>
        </div>

        {/* Search button */}
        <button
          type="button"
          className={styles.searchBtn}
          onClick={() => {
            const params = new URLSearchParams();
            if (location) params.set('city', location);
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

      <MobileTabBar active="explore" />

      {/* ── When: backdrop + bottom sheet ── */}
      <div
        className={styles.sheetBackdrop}
        style={{ opacity: openWhen ? 1 : 0, pointerEvents: openWhen ? 'auto' : 'none' }}
        onClick={() => setOpenWhen(false)}
      />
      <div className={styles.sheet} style={{ transform: openWhen ? 'translateY(0%)' : 'translateY(100%)' }}>
        <div className={styles.sheetGrabberWrap}>
          <div className={styles.sheetGrabber} />
        </div>

        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>When</span>
          <button type="button" className={styles.sheetClose} onClick={() => setOpenWhen(false)} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4a3d6b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.sheetTabs}>
          {(['date', 'month'] as const).map(tab => {
            const active = tab === mode;
            const labels = { date: 'By date', month: 'By month' };
            return (
              <button
                key={tab}
                type="button"
                className={styles.sheetTab}
                style={{
                  background: active ? 'linear-gradient(180deg, #7c3aed, #6d28d9)' : 'transparent',
                  color: active ? '#fff' : '#4a3d6b',
                  boxShadow: active ? '0 6px 14px -4px rgba(109,40,217,.45)' : 'none',
                }}
                onClick={() => setMode(tab)}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className={styles.sheetBody}>
          {mode === 'date' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label className={styles.fieldLabel}>Move-in</label>
                <input
                  type="date"
                  value={moveIn}
                  min={todayStr()}
                  onChange={e => handleMoveInChange(e.target.value)}
                  className={styles.dateInput}
                />
              </div>

              <button
                type="button"
                className={styles.noEndToggle}
                style={{
                  borderColor: noEndDate ? '#6d28d9' : 'var(--border)',
                  background: noEndDate ? '#f3effe' : '#fff',
                }}
                onClick={() => setNoEndDate(p => { const next = !p; if (next) setMoveOut(''); return next; })}
              >
                <span
                  className={styles.noEndCheckbox}
                  style={{
                    borderColor: noEndDate ? '#6d28d9' : '#d4cfe0',
                    background: noEndDate ? '#6d28d9' : '#fff',
                  }}
                >
                  {noEndDate && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span className={styles.noEndLabel}>No end date yet — I&apos;ll figure out move-out later</span>
              </button>

              {!noEndDate && (
                <div style={{ marginBottom: 14 }}>
                  <label className={styles.fieldLabel}>Move-out</label>
                  <input
                    type="date"
                    value={moveOut}
                    min={moveIn || todayStr()}
                    onChange={e => setMoveOut(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              )}

              <div className={styles.fieldLabel} style={{ marginBottom: 9 }}>Flexibility</div>
              <div className={styles.chipRow}>
                {FLEX_OPTS.map(f => {
                  const active = flex === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      className={styles.flexChip}
                      style={{
                        color: active ? '#6d28d9' : '#4a3d6b',
                        background: active ? '#f3effe' : '#fff',
                        borderColor: active ? '#6d28d9' : 'var(--border)',
                      }}
                      onClick={() => setFlex(f.key)}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {mode === 'month' && (
            <>
              <label className={styles.fieldLabel}>Move-in month</label>
              <div className={styles.monthSelectWrap}>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className={styles.monthSelect}
                >
                  {monthOptions.map(mo => (
                    <option key={mo.value} value={mo.value}>{mo.label}</option>
                  ))}
                </select>
                <span className={styles.monthSelectChevron}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </div>

              <div className={styles.fieldLabel} style={{ marginBottom: 10 }}>How long will you stay?</div>
              <div className={styles.stayRow}>
                <span className={styles.stayLabel}>{stayMonths === 1 ? 'Month' : 'Months'}</span>
                <div className={styles.stayStepper}>
                  <button type="button" className={styles.stepperBtn} onClick={() => setStayMonths(m => Math.max(1, m - 1))}>−</button>
                  <div className={styles.stepperValue}>{stayMonths}</div>
                  <button type="button" className={styles.stepperBtn} onClick={() => setStayMonths(m => Math.min(24, m + 1))}>+</button>
                </div>
              </div>
            </>
          )}

          <div className={styles.sheetFooter}>
            <button type="button" className={styles.sheetClearBtn} onClick={handleClearWhen}>Clear</button>
            <button type="button" className={styles.sheetApplyBtn} onClick={() => setOpenWhen(false)}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
