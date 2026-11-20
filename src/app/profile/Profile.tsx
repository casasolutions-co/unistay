'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, sendEmailVerification, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  OCCUPATIONS, TRAITS, TRAITS_MAX, TRAITS_MIN, ABOUT_MAX, ABOUT_MIN, aboutMeMissing, normalizeOccupation, type Occupation,
} from '@/lib/aboutMe';
import { COUNTRIES, START_YEARS, HOUSING_TYPES } from '@/lib/profileOptions';
import { previewUrlFor } from '@/lib/heicPreview';
import AppNav from '../components/AppNav';
import MobileTabBar from '../components/MobileTabBar';
import s from './Profile.module.css';

/* ── Data ── */
type Housing = { city: string; types: string[]; minPrice: string; maxPrice: string; moveIn: string };
type Form = {
  name: string; email: string; phone: string; nationality: string; residenceCountry: string; residenceCity: string;
  occupation: Occupation | ''; university: string; program: string; startYear: string; jobTitle: string;
  managementType: string; propertiesCount: string; propertyCities: string;
  why: string; traits: string[]; about: string; housing: Housing;
};
type ApiUser = {
  name?: string | null; email?: string; phone?: string | null; nationality?: string | null;
  residence_country?: string | null; residence_city?: string | null; role?: string; occupation?: string | null;
  university?: string | null; program?: string | null; start_year?: string | null; job_title?: string | null;
  management_type?: string | null; properties_count?: number | null; property_cities?: string | null;
  why?: string | null; traits?: string[]; about?: string | null; photo_url?: string | null;
  verification_status?: string; email_verified?: number;
  preferences?: { housing?: { city?: string; types?: string[]; minPrice?: number | null; maxPrice?: number | null; moveIn?: string } };
};

const MGMT: Record<string, string> = { private: 'Private owner', agency: 'Agency', company: 'Company' };
const OCC_HEADING: Record<Occupation, string> = { student: 'Studies', professional: 'Work', landlord: 'Renting out' };
const str = (v: string | number | null | undefined) => (v == null ? '' : String(v));

function toForm(u: ApiUser): Form {
  const h = u.preferences?.housing ?? {};
  return {
    name: str(u.name), email: str(u.email), phone: str(u.phone), nationality: str(u.nationality),
    residenceCountry: str(u.residence_country), residenceCity: str(u.residence_city),
    // Rows from before occupation existed: same guess the migration backfill makes.
    occupation: normalizeOccupation(u.occupation) ?? (u.role === 'landlord' ? 'landlord' : u.job_title ? 'professional' : 'student'),
    university: str(u.university), program: str(u.program), startYear: str(u.start_year), jobTitle: str(u.job_title),
    managementType: str(u.management_type), propertiesCount: str(u.properties_count), propertyCities: str(u.property_cities),
    why: str(u.why), traits: u.traits ?? [], about: str(u.about),
    housing: { city: str(h.city), types: h.types ?? [], minPrice: str(h.minPrice), maxPrice: str(h.maxPrice), moveIn: str(h.moveIn) },
  };
}

function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Only same-origin paths, so ?next= can't send the user off-site.
function nextPath(): string | null {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

function Check({ size = 12 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
  );
}

function Field({ label, children }: { label: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return <div><label className={s.label} htmlFor={id}>{label}</label>{children(id)}</div>;
}

function Facts({ title, rows }: { title: string; rows: { label: string; value: string; verified?: boolean }[] }) {
  const shown = rows.filter(r => r.value);
  if (!shown.length) return null;
  return (
    <div className={s.facts}>
      <h3 className={s.factsTitle}>{title}</h3>
      <dl className={s.factsGrid}>
        {shown.map(r => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}{r.verified && <span className={s.tick} role="img" aria-label="Verified"><Check size={13} /></span>}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── Page ── */
export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [draft, setDraft] = useState<Form | null>(null);
  const [editing, setEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [idStatus, setIdStatus] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (u: User, forceToken = false) => {
    try {
      const token = await u.getIdToken(forceToken);
      const res = await fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json().catch(() => ({})) as { user?: ApiUser };
      if (!d.user) throw new Error();
      const f = toForm(d.user);
      setSaved(f);
      setDraft(f);
      setPhotoUrl(d.user.photo_url ?? null);
      setIdStatus(d.user.verification_status ?? 'unverified');
      setEmailVerified(!!d.user.email_verified || u.emailVerified);
    } catch {
      setError('Could not load your profile.');
    }
  }, []);

  useEffect(() => onAuthStateChanged(auth, u => {
    setUser(u);
    if (u) load(u);
    else router.replace('/login');
  }), [router, load]);

  // The verification link opens in another tab; when the user comes back, ask Firebase
  // again and refresh the token so the server mirrors the new email_verified claim.
  useEffect(() => {
    if (!user || emailVerified) return;
    const recheck = async () => {
      await user.reload().catch(() => {});
      if (auth.currentUser?.emailVerified) load(auth.currentUser, true);
    };
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, [user, emailVerified, load]);

  if (!saved || !draft) {
    return (
      <div className={s.page}>
        <AppNav />
        <p className={s.loading} role="status">{error || 'Loading your profile…'}</p>
        <MobileTabBar active="profile" />
      </div>
    );
  }

  const hasPhoto = !!photoUrl;
  const occ = saved.occupation || 'student';
  const tenant = occ !== 'landlord';
  const aboutMissing = aboutMeMissing({ hasPhoto, occupation: saved.occupation, traits: saved.traits, about: saved.about });
  const canVerify = aboutMissing.length === 0;
  const idVerified = idStatus === 'verified';
  const idPending = idStatus === 'pending';
  const h = saved.housing;

  const roleDone = occ === 'student' ? !!(saved.university && saved.program && saved.startYear)
    : occ === 'professional' ? !!saved.jobTitle
    : !!(saved.managementType || saved.propertiesCount || saved.propertyCities);
  type Todo = { label: string; done: boolean; kind?: 'edit' | 'photo' | 'email' | 'verify' };
  const todos: Todo[] = [
    { label: 'Create your account', done: true },
    { label: 'Verify your email', done: emailVerified, kind: 'email' },
    { label: 'Add phone number', done: !!saved.phone, kind: 'edit' },
    { label: occ === 'student' ? 'Add study details' : occ === 'professional' ? 'Add your job' : 'Add rental details', done: roleDone, kind: 'edit' },
    ...(tenant ? [{ label: 'Set housing preferences', done: !!(h.city || h.types.length || h.maxPrice), kind: 'edit' as const }] : []),
    { label: 'Upload a profile photo', done: hasPhoto, kind: 'photo' },
    { label: `Pick ${TRAITS_MIN}–${TRAITS_MAX} traits`, done: saved.traits.length >= TRAITS_MIN, kind: 'edit' },
    { label: 'Write about yourself', done: saved.about.trim().length >= ABOUT_MIN, kind: 'edit' },
    { label: 'Verify your identity', done: idVerified, kind: 'verify' },
  ];
  const doneCount = todos.filter(t => t.done).length;
  const pct = Math.round((doneCount / todos.length) * 100);
  const initials = (saved.name || saved.email).trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
  const occTitle = OCCUPATIONS.find(o => o.value === occ)?.title ?? '';

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setDraft(d => d && { ...d, [k]: v });
  const setHousing = <K extends keyof Housing>(k: K, v: Housing[K]) => setDraft(d => d && { ...d, housing: { ...d.housing, [k]: v } });
  const toggle = (list: string[], v: string, max = Infinity) =>
    list.includes(v) ? list.filter(x => x !== v) : list.length < max ? [...list, v] : list;

  function startEdit() {
    // First edit: seed the about text with the sign-up "Why UniStay?" answer.
    setDraft({ ...saved!, about: saved!.about || saved!.why });
    setError('');
    setEditing(true);
  }

  async function save() {
    if (!user || !draft || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: await user.getIdToken(),
          name: draft.name, phone: draft.phone, nationality: draft.nationality,
          residenceCountry: draft.residenceCountry, residenceCity: draft.residenceCity,
          occupation: draft.occupation,
          university: draft.university, program: draft.program, startYear: draft.startYear, jobTitle: draft.jobTitle,
          managementType: draft.managementType, propertiesCount: draft.propertiesCount, propertyCities: draft.propertyCities,
          traits: draft.traits, about: draft.about,
          housing: draft.occupation === 'landlord' ? undefined : draft.housing,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(draft);
      setEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const next = nextPath();
      if (next && !aboutMeMissing({ hasPhoto, occupation: draft.occupation, traits: draft.traits, about: draft.about }).length) router.push(next);
    } catch {
      setError('Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function pickPhoto(file: File | undefined) {
    if (!file || !user) return;
    const before = photoUrl;
    setPhotoBusy(true);
    setError('');
    setPhotoUrl(await previewUrlFor(file));
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch('/api/user/photo', {
        method: 'POST', headers: { Authorization: `Bearer ${await user.getIdToken()}` }, body: form,
      });
      const d = await res.json().catch(() => ({})) as { photo_url?: string; error?: string };
      if (!res.ok) throw new Error(d.error ?? 'Photo upload failed.');
      if (d.photo_url) setPhotoUrl(d.photo_url);
    } catch (err) {
      setPhotoUrl(before);
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function sendEmail() {
    if (!user) return;
    setError('');
    try {
      await sendEmailVerification(user);
      setEmailSent(true);
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(code === 'auth/too-many-requests' ? 'Too many emails sent — wait a few minutes and try again.' : 'Could not send the verification email.');
    }
  }

  const photoInput = (
    <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className={s.fileInput}
      aria-label="Upload profile photo" disabled={photoBusy} onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
  );

  const occRows = occ === 'student'
    ? [{ label: 'University', value: saved.university }, { label: 'Program', value: saved.program }, { label: 'Start year', value: saved.startYear }]
    : occ === 'professional' ? [{ label: 'Job title', value: saved.jobTitle }]
    : [{ label: 'Rents as', value: MGMT[saved.managementType] ?? saved.managementType }, { label: 'Properties', value: saved.propertiesCount }, { label: 'Cities', value: saved.propertyCities }];
  const budget = h.minPrice || h.maxPrice ? `€${h.minPrice || '0'} – €${h.maxPrice || '…'} / month` : '';

  const d = draft;
  return (
    <div className={s.page}>
      <AppNav />

      <div className={s.mobileHeader}>
        <button type="button" className={s.backBtn} onClick={() => router.back()} aria-label="Back">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <span className={s.mobileTitle}>{editing ? 'Edit profile' : 'Profile'}</span>
      </div>

      <div className={s.layout}>
        {/* ── Left: identity + checklist ── */}
        <aside className={s.aside}>
          <Link href="/settings" className={s.backLink}>‹ Back to settings</Link>

          <div className={s.card} style={{ textAlign: 'center' }}>
            <div className={s.avatarWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element -- signed R2 URL / blob preview */}
              {hasPhoto ? <img src={photoUrl!} alt="Your profile photo" className={s.avatar} /> : <span className={s.avatarInitials}>{initials}</span>}
              <label className={s.cameraBtn} title="Upload photo">
                {photoBusy ? <span className={s.spinner} /> : (
                  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3.5" /></svg>
                )}
                {photoInput}
              </label>
            </div>
            {!hasPhoto && <p className={s.photoHint}>Add a clear photo of your face</p>}
            <p className={s.name}>{saved.name || saved.email.split('@')[0]}</p>
            <p className={s.occ}>{occTitle}</p>
            <span className={idVerified ? s.badgeGreen : idPending ? s.badgeAmber : s.badge}>
              {idVerified ? <><Check /> Verified</> : idPending ? 'ID in review' : 'Not verified'}
            </span>
            <div className={s.progress}>
              <div className={s.progressHead}><span>Profile complete</span><span className={s.accent}>{pct}%</span></div>
              <div className={s.track}><div className={s.fill} style={{ width: `${pct}%` }} /></div>
            </div>
          </div>

          <section className={s.card} aria-labelledby="todo-h">
            <div className={s.todoHead}>
              <h2 id="todo-h">Complete your profile</h2>
              <span className={s.accent}>{doneCount}/{todos.length}</span>
            </div>
            {doneCount === todos.length && <p className={s.allDone}>All done — your profile is complete.</p>}
            <ul className={s.todos}>
              {todos.map(t => {
                const inner = (action?: string) => (
                  <>
                    {t.done ? <span className={s.dotDone}><Check /></span> : <span className={s.dot} />}
                    <span className={t.done ? s.todoDone : s.todoLabel}>{t.label}</span>
                    {action && <span className={s.todoAction}>{action}</span>}
                  </>
                );
                return (
                  <li key={t.label}>
                    {t.done ? <div className={s.todoRow}>{inner()}<span className="sr-only"> (done)</span></div>
                      : t.kind === 'photo' ? <label className={s.todoBtn}>{inner('Upload')}{photoInput}</label>
                      : t.kind === 'email' ? <button type="button" className={s.todoBtn} onClick={sendEmail}>{inner(emailSent ? 'Resend' : 'Verify')}</button>
                      : t.kind === 'verify' ? (
                        idPending ? <div className={s.todoRow}>{inner('In review')}</div>
                          : canVerify ? <Link href="/verify?next=/profile" className={s.todoBtn}>{inner('Verify')}</Link>
                          : <div className={s.todoRow}>{inner('Locked')}</div>
                      )
                      : <button type="button" className={s.todoBtn} onClick={startEdit}>{inner('Add')}</button>}
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>

        {/* ── Right ── */}
        <main className={s.main}>
          <div className={s.head}>
            <h1 className={s.title}>{editing ? 'Edit profile' : 'Profile'}</h1>
            {!editing && (
              <button type="button" className={s.ghostBtn} onClick={startEdit}>
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
                {canVerify ? 'Edit profile' : 'Finish profile'}
              </button>
            )}
          </div>

          {error && <p className={s.error} role="alert">{error}</p>}

          {!editing ? (
            <section className={s.card}>
              <h2 className={s.h2}>About me</h2>
              {saved.about.trim()
                ? <p className={s.about}>{saved.about}</p>
                : <p className={s.empty}>No intro yet — add a few lines in Edit profile.</p>}
              {saved.traits.length > 0 && (
                <ul className={s.traitList}>{saved.traits.map(t => <li key={t} className={s.traitView}>{t}</li>)}</ul>
              )}
              <Facts title="Details" rows={[
                { label: 'Full name', value: saved.name },
                { label: 'Email', value: saved.email, verified: emailVerified },
                { label: 'Phone', value: saved.phone },
                { label: 'Nationality', value: saved.nationality },
                { label: 'Lives in', value: [saved.residenceCity, saved.residenceCountry].filter(Boolean).join(', ') },
              ]} />
              <Facts title={OCC_HEADING[occ]} rows={occRows} />
              {tenant && <Facts title="Looking for" rows={[
                { label: 'City', value: h.city },
                { label: 'Type of place', value: h.types.join(', ') },
                { label: 'Budget', value: budget },
                { label: 'Move-in', value: h.moveIn ? fmtDate(h.moveIn) : '' },
              ]} />}
            </section>
          ) : (
            <section className={`${s.card} ${s.form}`}>
              <div>
                <h2 className={s.h2}>Personal information</h2>
                <p className={s.sub}>From your sign-up. Your photo is changed from the profile card.</p>
                <div className={s.grid}>
                  <Field label="Full name">{id => <input id={id} className={s.input} value={d.name} onChange={e => set('name', e.target.value)} autoComplete="name" />}</Field>
                  <Field label="Email (login)">{id => <input id={id} className={s.input} value={d.email} readOnly />}</Field>
                  <Field label="Phone">{id => <input id={id} className={s.input} type="tel" value={d.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel" />}</Field>
                  <Field label="Nationality">{id => (
                    <select id={id} className={s.input} value={d.nationality} onChange={e => set('nationality', e.target.value)}>
                      <option value="">Select…</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  )}</Field>
                  <Field label="Country of residence">{id => (
                    <select id={id} className={s.input} value={d.residenceCountry} onChange={e => set('residenceCountry', e.target.value)}>
                      <option value="">Select…</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  )}</Field>
                  <Field label="City">{id => <input id={id} className={s.input} value={d.residenceCity} onChange={e => set('residenceCity', e.target.value)} />}</Field>
                </div>
              </div>

              <div>
                <h2 className={s.h2} id="occ-h">I am a</h2>
                <div className={s.occRow} role="radiogroup" aria-labelledby="occ-h">
                  {OCCUPATIONS.map(o => (
                    <button key={o.value} type="button" role="radio" aria-checked={d.occupation === o.value}
                      className={d.occupation === o.value ? s.occOn : s.occOff} onClick={() => set('occupation', o.value)}>
                      <span className={s.occTitle}>{o.title}</span><span className={s.occSub}>{o.sub}</span>
                    </button>
                  ))}
                </div>
                {d.occupation === 'student' && (
                  <div className={s.grid}>
                    <Field label="University">{id => <input id={id} className={s.input} value={d.university} onChange={e => set('university', e.target.value)} />}</Field>
                    <Field label="Program / course">{id => <input id={id} className={s.input} value={d.program} onChange={e => set('program', e.target.value)} />}</Field>
                    <Field label="Start year">{id => (
                      <select id={id} className={s.input} value={d.startYear} onChange={e => set('startYear', e.target.value)}>
                        <option value="">Year…</option>{START_YEARS.map(y => <option key={y}>{y}</option>)}
                      </select>
                    )}</Field>
                  </div>
                )}
                {d.occupation === 'professional' && (
                  <div className={s.grid}>
                    <Field label="Job title">{id => <input id={id} className={s.input} value={d.jobTitle} onChange={e => set('jobTitle', e.target.value)} />}</Field>
                  </div>
                )}
                {d.occupation === 'landlord' && (
                  <div className={s.grid}>
                    <Field label="How do you rent?">{id => (
                      <select id={id} className={s.input} value={d.managementType} onChange={e => set('managementType', e.target.value)}>
                        <option value="">Select…</option>{Object.entries(MGMT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    )}</Field>
                    <Field label="Number of properties">{id => <input id={id} className={s.input} inputMode="numeric" value={d.propertiesCount} onChange={e => set('propertiesCount', e.target.value.replace(/\D/g, ''))} />}</Field>
                    <Field label="Cities">{id => <input id={id} className={s.input} value={d.propertyCities} onChange={e => set('propertyCities', e.target.value)} />}</Field>
                  </div>
                )}
              </div>

              {d.occupation !== 'landlord' && (
                <div>
                  <h2 className={s.h2}>Housing preferences</h2>
                  <p className={s.sub}>Search pre-fills its filters from these.</p>
                  <div className={s.grid}>
                    <Field label="Where in Germany?">{id => <input id={id} className={s.input} value={d.housing.city} onChange={e => setHousing('city', e.target.value)} />}</Field>
                    <Field label="Min rent (€/month)">{id => <input id={id} className={s.input} inputMode="numeric" value={d.housing.minPrice} onChange={e => setHousing('minPrice', e.target.value.replace(/\D/g, ''))} />}</Field>
                    <Field label="Max rent (€/month)">{id => <input id={id} className={s.input} inputMode="numeric" value={d.housing.maxPrice} onChange={e => setHousing('maxPrice', e.target.value.replace(/\D/g, ''))} />}</Field>
                    <Field label="Move-in date">{id => <input id={id} className={s.input} type="date" value={d.housing.moveIn} onChange={e => setHousing('moveIn', e.target.value)} />}</Field>
                  </div>
                  <span className={s.label} style={{ marginTop: 16 }}>Type of place</span>
                  <div className={s.chips}>
                    {HOUSING_TYPES.map(t => (
                      <button key={t} type="button" aria-pressed={d.housing.types.includes(t)} className={d.housing.types.includes(t) ? s.chipOn : s.chip}
                        onClick={() => setHousing('types', toggle(d.housing.types, t))}>{t}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className={s.divided}>
                <h2 className={s.h2}>Which of these describe you best?</h2>
                <p className={s.sub}>Pick {TRAITS_MIN} to {TRAITS_MAX} · {d.traits.length} selected</p>
                <div className={s.chips}>
                  {TRAITS.map(t => {
                    const on = d.traits.includes(t);
                    return (
                      <button key={t} type="button" aria-pressed={on} className={on ? s.chipOn : s.chip}
                        disabled={!on && d.traits.length >= TRAITS_MAX} onClick={() => set('traits', toggle(d.traits, t, TRAITS_MAX))}>{t}</button>
                    );
                  })}
                </div>
              </div>

              <Field label="About me">{id => (
                <>
                  <textarea id={id} className={s.input} rows={5} maxLength={ABOUT_MAX} value={d.about} onChange={e => set('about', e.target.value)}
                    placeholder="A few lines about yourself — what you study or do, what you're like to live with, what brings you here." />
                  <p className={s.counter}>{d.about.trim().length < ABOUT_MIN ? `At least ${ABOUT_MIN} characters · ` : ''}{d.about.length}/{ABOUT_MAX}</p>
                </>
              )}</Field>

              <div className={s.formFoot}>
                <p className={s.sub} style={{ margin: 0, flex: '1 1 240px' }}>
                  {(() => {
                    const m = aboutMeMissing({ hasPhoto, occupation: d.occupation, traits: d.traits, about: d.about });
                    return m.length ? `You can save now. Still needed to verify: ${m.join(', ')}.` : 'All set — saving unlocks identity verification.';
                  })()}
                </p>
                <div className={s.formBtns}>
                  <button type="button" className={s.ghostBtn} onClick={() => { setEditing(false); setDraft(saved); setError(''); }}>Cancel</button>
                  <button type="button" className={s.primaryBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
                </div>
              </div>
            </section>
          )}

          <section className={s.card}>
            <h2 className={s.h2}>Verification</h2>
            <p className={s.sub}>Identity verification unlocks once your photo and About me are complete.</p>
            <div className={s.verifyRow}>
              <div className={s.verifyBody}>
                <div className={s.verifyLabel}>Email</div>
                <div className={s.verifySub}>{emailVerified ? saved.email : emailSent ? `Link sent to ${saved.email} — check your inbox` : `${saved.email} · not verified yet`}</div>
              </div>
              {emailVerified ? <span className={s.badgeGreen}>Verified</span>
                : <button type="button" className={s.primaryBtn} onClick={sendEmail}>{emailSent ? 'Resend link' : 'Verify email'}</button>}
            </div>
            <div className={s.verifyRow}>
              <div className={s.verifyBody}>
                <div className={s.verifyLabel}>Government ID</div>
                <div className={s.verifySub}>{idVerified ? 'Verified with Didit' : idPending ? 'In review — usually a few minutes' : 'Via Didit — ID scan + selfie'}</div>
              </div>
              {idVerified ? <span className={s.badgeGreen}>Verified</span>
                : idPending ? <span className={s.badgeAmber}>In review</span>
                : canVerify ? <Link href="/verify?next=/profile" className={s.primaryBtn}>Verify with Didit</Link>
                : <span className={s.badgeGrey}>Finish your profile first</span>}
            </div>
          </section>
        </main>
      </div>

      <MobileTabBar active="profile" />
    </div>
  );
}
