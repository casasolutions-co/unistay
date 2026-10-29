'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { HOUSING_TYPES } from '@/lib/profileOptions';
import { useCitySearch } from '@/lib/useCitySearch';
import AppNav from '../../components/AppNav';
import styles from '../page.module.css';
import p from './page.module.css';

const Check = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Step 3 of registration: what the user is looking for. Stored as
// users.preferences.housing and used by /search to pre-fill its filters.
export default function HousingPreferences() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // City must come from the suggestion list so it's the canonical spelling
  // search matches on ("München", not "Munich"); typing clears the pick.
  const { query: cityQuery, setQuery: setCityQuery, groups } = useCitySearch();
  const [city, setCity] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const citySuggestions = groups.flatMap(g => g.items).filter(it => it.kind !== 'uni').slice(0, 8);
  const [types, setTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [moveIn, setMoveIn] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, u => {
    if (!u) router.replace('/login');
    else setUser(u);
  }), [router]);

  const toggleType = (t: string) =>
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          housing: {
            city,
            types,
            minPrice: minPrice ? Number(minPrice) : null,
            maxPrice: maxPrice ? Number(maxPrice) : null,
            moveIn,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed');
      router.push('/search');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <AppNav />

      <div className={styles.split}>
        <div className={`${styles.imagePanel} ${p.hideOnMobile}`}>
          <div
            className={styles.imageBg}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(20,14,32,.25) 0%, rgba(20,14,32,.1) 45%, rgba(20,14,32,.75) 100%), url('/images/interior-cozy.jpg')`,
            }}
          />
          <div className={styles.imageContent}>
            <div className={styles.imageRule} />
            <h2 className={styles.imageHeadline}>Your next home, your way.</h2>
            <p className={styles.imageSub}>Tell us what you&apos;re after and we&apos;ll show it to you first.</p>
          </div>
        </div>

        <div className={`${styles.formPanel} ${p.formPad}`}>
          <div className={styles.formInner}>
            <div className={styles.stepper}>
              <div className={styles.stepItem}>
                <span className={styles.stepDot}><Check /></span>
                <span className={styles.stepLabel}>Account</span>
              </div>
              <span className={styles.stepLineActive} />
              <div className={styles.stepItem}>
                <span className={styles.stepDot}><Check /></span>
                <span className={styles.stepLabel}>Your Details</span>
              </div>
              <span className={styles.stepLineActive} />
              <div className={styles.stepItem}>
                <span className={styles.stepDot}>3</span>
                <span className={styles.stepLabel}>Preferences</span>
              </div>
            </div>

            <p className={styles.eyebrow}>Almost done</p>
            <h1 className={styles.headline}>What are you looking for?</h1>
            <p className={styles.subline}>All optional — you can change this any time.</p>

            <label className={styles.label}>Where in Germany?</label>
            <div className={p.cityWrap}>
              <input type="text" className={styles.fieldNoIcon} placeholder="Start typing, e.g. München"
                role="combobox" aria-controls="pref-city-list" aria-expanded={cityOpen} aria-autocomplete="list" autoComplete="off"
                value={cityQuery}
                onChange={e => { setCityQuery(e.target.value); setCity(''); setCityOpen(true); }}
                onFocus={() => setCityOpen(true)}
                onBlur={() => setTimeout(() => setCityOpen(false), 150)} />
              {cityOpen && citySuggestions.length > 0 && (
                <ul id="pref-city-list" className={p.cityList} role="listbox">
                  {citySuggestions.map(it => (
                    <li key={it.kind + it.name} role="option" aria-selected={it.name === city}>
                      <button type="button" className={p.cityOption}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setCity(it.name); setCityQuery(it.name); setCityOpen(false); }}>
                        {it.name} <span>{it.sub}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {cityQuery && !city && !cityOpen && <p className={p.cityHint}>Pick a city from the list</p>}
            </div>

            <label className={styles.label}>Type of place</label>
            <div className={p.chips}>
              {HOUSING_TYPES.map(t => (
                <button key={t} type="button" aria-pressed={types.includes(t)}
                  className={types.includes(t) ? styles.roleBtnActive : styles.roleBtn}
                  onClick={() => toggleType(t)}>
                  {t}
                </button>
              ))}
            </div>

            <div className={styles.row}>
              <div className={styles.rowCol}>
                <label className={styles.label}>Min rent (€/month)</label>
                <input type="number" inputMode="numeric" min={0} max={3000} step={50} className={styles.fieldNoIcon}
                  placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              </div>
              <div className={styles.rowCol}>
                <label className={styles.label}>Max rent (€/month)</label>
                <input type="number" inputMode="numeric" min={0} max={3000} step={50} className={styles.fieldNoIcon}
                  placeholder="3000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
            </div>

            <label className={styles.label}>Move-in date</label>
            <input type="date" className={styles.fieldNoIcon}
              value={moveIn} onChange={e => setMoveIn(e.target.value)} />

            {error && <p style={{ fontSize: 13, fontWeight: 600, color: '#c2557a', margin: '8px 0', textAlign: 'center' }}>{error}</p>}

            <button type="button" className={styles.createBtn} disabled={!user || saving} onClick={handleSave}
              style={{ marginTop: 24, width: '100%' }}>
              {saving ? 'Saving…' : 'Save & start searching'}
            </button>
            <button type="button" className={p.skipBtn} onClick={() => router.push('/search')}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
