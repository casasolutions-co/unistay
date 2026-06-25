'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './RegisterMobile.module.css';

/* ── Custom picker ──────────────────────────────────────────────── */
interface CustomPickerProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  title: string;
  options: string[];
}

function CustomPicker({ value, onChange, placeholder, title, options }: CustomPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`${styles.pickerBtn} ${open ? styles.pickerBtnOpen : ''}`}
        onClick={() => setOpen(true)}
      >
        <span className={value ? styles.pickerValue : styles.pickerPlaceholder}>
          {value || placeholder}
        </span>
        <span className={`${styles.pickerChevron} ${open ? styles.pickerChevronOpen : ''}`}>
          <IChevDown />
        </span>
      </button>
      {open && (
        <div className={styles.pickerOverlay} onClick={() => setOpen(false)}>
          <div className={styles.pickerSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.pickerSheetHeader}>
              <p className={styles.pickerSheetTitle}>{title}</p>
              <button type="button" className={styles.pickerSheetClose} onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className={styles.pickerList}>
              {options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`${styles.pickerOption} ${value === opt ? styles.pickerOptionActive : ''}`}
                  onClick={() => { onChange(opt); setOpen(false); }}
                >
                  {opt}
                  {value === opt && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

async function syncUser(token: string, role?: string): Promise<boolean> {
  const res = await fetch('/api/auth/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, role }),
  });
  if (!res.ok) throw new Error('Sync failed');
  const { user } = await res.json();
  return !!user?.profile_complete;
}

async function saveProfile(token: string, data: Record<string, string | null>) {
  const res = await fetch('/api/user/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...data }),
  });
  if (!res.ok) throw new Error('Profile save failed');
}

type Role = 'student' | 'employed' | null;

/* ── Icons ──────────────────────────────────────────────────────── */
const IBack = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

const IEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const IEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2" />
    <path d="M9.4 5.2A9.4 9.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 2.7-.4" />
  </svg>
);

const IArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const ICheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IChevDown = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IStudent = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
  </svg>
);

const IEmployed = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.3 17.6 9.5 24 9.5Z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.2-9.6 6.2-17Z" />
    <path fill="#FBBC05" d="M10.4 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1Z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.6 2.1-8.8 2.1-6.4 0-11.8-3.8-13.6-9.2l-7.9 6.1C6.4 42.6 14.6 48 24 48Z" />
  </svg>
);


/* ── Main component ─────────────────────────────────────────────── */
interface RegisterMobileProps {
  legalAgreed: boolean;
  onOpenLegal: (doc: 'terms' | 'privacy') => void;
}

export default function RegisterMobile({ legalAgreed, onOpenLegal }: RegisterMobileProps) {
  const router = useRouter();
  const [step, setStep]           = useState<1 | 2>(1);
  const [pwVisible, setPwVisible] = useState(false);
  const [role, setRole]           = useState<Role>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  /* Step 1 */
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  /* Step 2 */
  const [nationality, setNationality] = useState('');
  const [phone,       setPhone]       = useState('');
  const [university,  setUniversity]  = useState('');
  const [program,     setProgram]     = useState('');
  const [startYear,   setStartYear]   = useState('');
  const [jobTitle,    setJobTitle]    = useState('');
  const [why,         setWhy]         = useState('');

  /* ── Derived ── */
  const canNext     = !!(name.trim() && email.trim() && password.length >= 8);
  const studentReq  = role === 'student' ? !!(university.trim() && program.trim() && startYear) : true;
  const canCreate   = !!(nationality && phone.trim() && role && studentReq);
  const enabled     = step === 1 ? canNext : canCreate;

  const bannerTitle = step === 1
    ? 'Find your home in Germany.'
    : 'Your profile, your story.';

  const handlePrimary = async () => {
    if (step === 1 && canNext) { setStep(2); return; }
    if (step === 2 && canCreate) {
      if (!legalAgreed) { onOpenLegal('terms'); return; }
      setLoading(true);
      setError('');
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        const token = await cred.user.getIdToken();
        await syncUser(token, role ?? 'student');
        await saveProfile(token, {
          name, phone, nationality, role: role ?? 'student',
          university, program, startYear, jobTitle, why,
        });
        router.push('/search');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('email-already-in-use')) setError('An account with this email already exists.');
        else if (msg.includes('weak-password')) setError('Password must be at least 8 characters.');
        else setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await cred.user.getIdToken();
      const profileComplete = await syncUser(token, 'student');
      router.push(profileComplete ? '/search' : '/register/complete');
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>

      {/* ── Photo banner ── */}
      <div className={styles.photoBanner}>

        {/* App bar */}
        <div className={styles.appBar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => step === 2 ? setStep(1) : undefined}
            aria-label="Back"
          >
            <IBack />
          </button>
          <span className={styles.stepPill}>Step {step} of 2</span>
        </div>

        {/* Headline */}
        <div className={styles.bannerContent}>
          <div className={styles.logoRow}>
            <Image src="/primary-logo.png" alt="UniStay" width={2049} height={1772} style={{ height: 40, width: 'auto', filter: 'brightness(0) invert(1)' }} priority />
          </div>
          <h1 className={styles.bannerTitle}>{bannerTitle}</h1>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM SHEET
      ══════════════════════════════════════════════════════════ */}
      <div className={styles.sheet}>

        {/* Handle + progress */}
        <div className={styles.sheetHeader}>
          <div className={styles.handle} />
          <div className={styles.progressRow}>
            <div className={styles.progressFilled} />
            <div className={step === 2 ? styles.progressFilled : styles.progressEmpty} />
          </div>
          <div className={styles.progressLabels}>
            <span className={styles.labelDone}>
              {step === 2 && <ICheck />}
              Account
            </span>
            <span className={step === 2 ? styles.labelDone : styles.labelPending}>
              Your details
            </span>
          </div>
        </div>

        {/* Scroll content */}
        <div className={styles.scrollContent}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <button type="button" className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
                <GoogleIcon />
                Continue with Google
              </button>

              <div className={styles.divider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerLabel}>OR</span>
                <span className={styles.dividerLine} />
              </div>

              <label className={styles.label}>Full name *</label>
              <input
                type="text"
                className={styles.field}
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
              />

              <label className={styles.label}>Email *</label>
              <input
                type="email"
                className={styles.field}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />

              <label className={styles.label}>Password *</label>
              <div className={styles.pwWrap}>
                <input
                  type={pwVisible ? 'text' : 'password'}
                  className={styles.pwField}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.pwToggle}
                  onClick={() => setPwVisible(v => !v)}
                >
                  {pwVisible ? <IEye /> : <IEyeOff />}
                </button>
              </div>

              <p className={styles.terms} style={{ marginTop: 8 }}>
                By registering you agree to our{' '}
                <button type="button" onClick={() => onOpenLegal('terms')} className={styles.termsLink} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>Terms</button> &amp;{' '}
                <button type="button" onClick={() => onOpenLegal('privacy')} className={styles.termsLink} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>Privacy Policy</button>.
              </p>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              <h2 className={styles.step2Title}>Tell us about you</h2>
              <p className={styles.step2Sub}>This helps landlords understand your situation.</p>

              {/* Nationality */}
              <label className={styles.label}>Nationality *</label>
              <CustomPicker
                value={nationality}
                onChange={setNationality}
                placeholder="Select nationality…"
                title="Nationality"
                options={['Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Bangladesh','Belarus','Belgium','Bolivia','Bosnia and Herzegovina','Brazil','Bulgaria','Cambodia','Cameroon','Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark','Ecuador','Egypt','Ethiopia','Finland','France','Georgia','Germany','Ghana','Greece','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan','Kenya','South Korea','Kosovo','Kuwait','Lebanon','Libya','Lithuania','Malaysia','Mexico','Moldova','Morocco','Nepal','Netherlands','New Zealand','Nigeria','North Macedonia','Norway','Pakistan','Palestine','Peru','Philippines','Poland','Portugal','Romania','Russia','Saudi Arabia','Serbia','Slovakia','Slovenia','South Africa','Spain','Sri Lanka','Sweden','Switzerland','Syria','Taiwan','Thailand','Tunisia','Turkey','Ukraine','United Arab Emirates','United Kingdom','United States','Uzbekistan','Venezuela','Vietnam','Yemen','Other']}
              />

              {/* Phone */}
              <label className={styles.label}>Phone *</label>
              <input
                type="tel"
                className={styles.field}
                placeholder="+49 …"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />

              {/* Role */}
              <label className={styles.label}>I am a *</label>
              <div className={styles.roleRow}>
                <button
                  type="button"
                  className={role === 'student' ? styles.roleBtnActive : styles.roleBtn}
                  onClick={() => setRole('student')}
                >
                  <IStudent /> Student
                </button>
                <button
                  type="button"
                  className={role === 'employed' ? styles.roleBtnActive : styles.roleBtn}
                  onClick={() => setRole('employed')}
                >
                  <IEmployed /> Employed
                </button>
              </div>

              {/* Student fields */}
              {role === 'student' && (
                <div>
                  <label className={styles.label}>University *</label>
                  <input
                    type="text"
                    className={styles.field}
                    placeholder="e.g. TU Berlin"
                    value={university}
                    onChange={e => setUniversity(e.target.value)}
                  />
                  <label className={styles.label}>Program *</label>
                  <input
                    type="text"
                    className={styles.field}
                    placeholder="e.g. M.Sc. Computer Science"
                    value={program}
                    onChange={e => setProgram(e.target.value)}
                  />
                  <label className={styles.label}>Expected graduation year *</label>
                  <CustomPicker
                    value={startYear}
                    onChange={setStartYear}
                    placeholder="Select year…"
                    title="Graduation year"
                    options={['2024','2025','2026','2027','2028','2029','2030']}
                  />
                </div>
              )}

              {/* Employed fields */}
              {role === 'employed' && (
                <div>
                  <label className={styles.label}>
                    What do you do? <span className={styles.optional}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    className={styles.field}
                    placeholder="e.g. Software Engineer at Siemens"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                  />
                </div>
              )}

              {/* Optional why */}
              {role && (
                <div>
                  <label className={styles.label}>
                    Why UniStay? <span className={styles.optional}>(optional)</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Tell us what you're looking for…"
                    rows={2}
                    value={why}
                    onChange={e => setWhy(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky CTA ── */}
        <div className={styles.ctaArea}>
          {error && <p style={{ fontSize: 13, fontWeight: 600, color: '#c2557a', margin: '0 0 10px', textAlign: 'center' }}>{error}</p>}
          <button
            type="button"
            className={styles.ctaBtn}
            disabled={!enabled || loading}
            onClick={handlePrimary}
          >
            {loading ? (step === 1 ? 'Loading…' : 'Creating…') : (step === 1 ? 'Continue' : 'Create Account')}
            <IArrow />
          </button>
          <p className={styles.ctaFooter}>
            {step === 1 ? (
              <>Already have an account?{' '}
                <a href="/login" className={styles.ctaLink}>Sign in</a>
              </>
            ) : (
              'By continuing you accept our terms.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
