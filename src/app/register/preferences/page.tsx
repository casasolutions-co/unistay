'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { HOUSING_TYPES } from '@/lib/profileOptions';
import AppNav from '../../components/AppNav';
import styles from '../page.module.css';
import p from './page.module.css';

// Optional step after registration: what the user is looking for. Stored as
// users.preferences.housing and used by /search to pre-fill its filters.
export default function HousingPreferences() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [city, setCity] = useState('');
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
            city: city.trim(),
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
            <p className={styles.eyebrow}>Almost done</p>
            <h1 className={styles.headline}>What are you looking for?</h1>
            <p className={styles.subline}>All optional — you can change this any time.</p>

            <label className={styles.label}>Where in Germany?</label>
            <input type="text" className={styles.fieldNoIcon} placeholder="e.g. Munich"
              value={city} onChange={e => setCity(e.target.value)} style={{ marginBottom: 18 }} />

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
