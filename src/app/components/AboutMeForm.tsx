'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  OCCUPATIONS, TRAITS, TRAITS_MAX, TRAITS_MIN, ABOUT_MAX, ABOUT_MIN, aboutMeMissing, type Occupation,
} from '@/lib/aboutMe';
import { previewUrlFor } from '@/lib/heicPreview';
import styles from './AboutMeForm.module.css';

type ProfileUser = {
  role?: string; job_title?: string | null; university?: string | null;
  photo_url?: string | null; occupation?: string | null; traits?: string[]; about?: string | null;
};

// Only same-origin paths, so ?next= can't send the user off-site.
function nextPath(): string | null {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

// "About me" section of /profile: photo, what you do, traits, about text.
// Required before identity verification; with ?next= it returns there after saving.
export default function AboutMeForm() {
  const router = useRouter();
  const id = useId();
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [occupation, setOccupation] = useState<Occupation | null>(null);
  const [traits, setTraits] = useState<string[]>([]);
  const [about, setAbout] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user.getIdToken()
      .then(token => fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } }))
      .then(r => r.json())
      .then((d: { user?: ProfileUser }) => {
        if (cancelled || !d.user) return;
        const u = d.user;
        setPreview(u.photo_url ?? null);
        // Saved value, else a guess from what they picked at signup.
        setOccupation((u.occupation as Occupation | null)
          ?? (u.role === 'landlord' ? 'landlord' : u.job_title ? 'professional' : u.university ? 'student' : null));
        setTraits(u.traits ?? []);
        setAbout(u.about ?? '');
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [user]);

  const missing = aboutMeMissing({ hasPhoto: !!preview, occupation, traits, about });
  const canSave = loaded && !missing.length && !!user && !saving;

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhoto(file);
    setSaved(false);
    setPreview(await previewUrlFor(file));
  }

  function toggleTrait(t: string) {
    setSaved(false);
    setTraits(cur => cur.includes(t) ? cur.filter(x => x !== t) : cur.length < TRAITS_MAX ? [...cur, t] : cur);
  }

  async function save() {
    if (!canSave || !user) return;
    setSaving(true);
    setError('');
    try {
      const form = new FormData();
      if (photo) form.append('photo', photo);
      form.append('occupation', occupation ?? '');
      form.append('traits', JSON.stringify(traits));
      form.append('about', about.trim());
      const res = await fetch('/api/user/about', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        body: form,
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not save your profile.');
      setPhoto(null);
      const next = nextPath();
      if (next) router.push(next);
      else setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div>
        <h2 className={styles.title}>About me</h2>
        <p className={styles.sub}>Hosts and tenants see this before they message you. Required before identity verification.</p>
      </div>

      <section>
        <span className={styles.label}>Profile photo</span>
        <label className={styles.photoRow}>
          <span className={styles.avatar} style={preview ? { backgroundImage: `url(${preview})` } : undefined}>
            {!preview && (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </span>
          <span>
            <span className={styles.photoBtn}>{preview ? 'Change photo' : 'Upload a photo'}</span>
            <span className={styles.hint}>A clear photo of your face · JPEG, PNG or HEIC, up to 10 MB</span>
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className={styles.fileInput}
            onChange={e => pickPhoto(e.target.files?.[0])} />
        </label>
      </section>

      <section>
        <span className={styles.label} id={`${id}-occ`}>I am a</span>
        <div className={styles.occRow} role="radiogroup" aria-labelledby={`${id}-occ`}>
          {OCCUPATIONS.map(o => (
            <button key={o.value} type="button" role="radio" aria-checked={occupation === o.value}
              className={occupation === o.value ? styles.occActive : styles.occ}
              onClick={() => { setOccupation(o.value); setSaved(false); }}>
              <span className={styles.occTitle}>{o.title}</span>
              <span className={styles.occSub}>{o.sub}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <span className={styles.label}>Which of these describe you best?</span>
        <p className={styles.hint} style={{ margin: '0 0 10px' }}>Pick {TRAITS_MIN} to {TRAITS_MAX} · {traits.length} selected</p>
        <div className={styles.chips}>
          {TRAITS.map(t => {
            const on = traits.includes(t);
            return (
              <button key={t} type="button" aria-pressed={on} className={on ? styles.chipOn : styles.chip}
                disabled={!on && traits.length >= TRAITS_MAX} onClick={() => toggleTrait(t)}>{t}</button>
            );
          })}
        </div>
      </section>

      <section>
        <label className={styles.label} htmlFor={`${id}-about`}>About me</label>
        <textarea id={`${id}-about`} className={styles.textarea} rows={5} maxLength={ABOUT_MAX} value={about}
          onChange={e => { setAbout(e.target.value); setSaved(false); }}
          placeholder="A few lines about yourself — what you study or do, what you're like to live with, what brings you here." />
        <p className={styles.counter}>{about.trim().length < ABOUT_MIN ? `At least ${ABOUT_MIN} characters · ` : ''}{about.length}/{ABOUT_MAX}</p>
      </section>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div>
        <button type="button" className={styles.saveBtn} disabled={!canSave} onClick={save}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && <p className={styles.saved} role="status">Saved — you can now verify your identity.</p>}
        {loaded && missing.length > 0 && <p className={styles.hint} style={{ marginTop: 10 }}>Still needed: {missing.join(', ')}</p>}
      </div>
    </div>
  );
}
