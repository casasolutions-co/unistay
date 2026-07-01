'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppNav from '../components/AppNav';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './page.module.css';
import RegisterMobile from './RegisterMobile';
import LegalModal from '../components/LegalModal';

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

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2" />
    <path d="M9.4 5.2A9.4 9.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 2.7-.4" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="19" height="19" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.3 17.6 9.5 24 9.5Z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.2-9.6 6.2-17Z" />
    <path fill="#FBBC05" d="M10.4 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1Z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.6 2.1-8.8 2.1-6.4 0-11.8-3.8-13.6-9.2l-7.9 6.1C6.4 42.6 14.6 48 24 48Z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const leftCopy = {
  1: {
    title: 'Find your home in Germany.',
    sub: 'Join thousands of people who found their perfect flat through UniStay.',
  },
  2: {
    title: 'Your profile, your story.',
    sub: 'A complete profile helps landlords say yes — faster.',
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [pwVisible, setPwVisible] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'terms' | 'privacy'>('terms');
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openLegal = (doc: 'terms' | 'privacy') => {
    setLegalDoc(doc);
    setLegalOpen(true);
  };

  async function handleCreateAccount() {
    if (!canCreate || !legalAgreed) return;
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
      if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists.');
      } else if (msg.includes('weak-password')) {
        setError('Password must be at least 8 characters.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
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
  }

  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 fields
  const [nationality, setNationality] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('');
  const [startYear, setStartYear] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [why, setWhy] = useState('');

  const canNext = name.trim() && email.trim() && password.length >= 8;

  const studentRequired = role === 'student'
    ? university.trim() && program.trim() && startYear
    : true;
  const canCreate = nationality && phone.trim() && role && studentRequired;

  const copy = leftCopy[step];

  return (
    <>
      <div className={styles.mobileOnly}>
        <RegisterMobile legalAgreed={legalAgreed} onOpenLegal={openLegal} />
      </div>
      <div className={styles.desktopOnly}>
    <div className={styles.page}>
      <AppNav />

      <div className={styles.split}>
        {/* Left image */}
        <div className={styles.imagePanel}>
          <div
            className={styles.imageBg}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(20,14,32,.25) 0%, rgba(20,14,32,.1) 45%, rgba(20,14,32,.75) 100%), url('/images/${step === 1 ? 'living-room' : 'bedroom'}.jpg')`,
            }}
          />
          <div className={styles.imageContent}>
            <div className={styles.imageRule} />
            <h2 className={styles.imageHeadline}>{copy.title}</h2>
            <p className={styles.imageSub}>{copy.sub}</p>
          </div>
        </div>

        {/* Right form */}
        <div className={styles.formPanel}>
          <div className={styles.formInner}>

            {/* Stepper */}
            <div className={styles.stepper}>
              <div className={styles.stepItem}>
                <span className={styles.stepDot}>
                  {step === 2 ? <CheckIcon /> : '1'}
                </span>
                <span className={styles.stepLabel}>Account</span>
              </div>
              <span className={step === 2 ? styles.stepLineActive : styles.stepLine} />
              <div className={styles.stepItem}>
                <span className={step === 2 ? styles.stepDot : styles.stepDotInactive}>2</span>
                <span className={step === 2 ? styles.stepLabel : styles.stepLabelInactive}>Your Details</span>
              </div>
            </div>

            {/* ── Step 1 ── */}
            {step === 1 && (
              <div>
                <p className={styles.eyebrow}>Join UniStay</p>
                <h1 className={styles.headline}>Let&apos;s get started</h1>
                <p className={styles.subline}>Create your free account.</p>

                <button type="button" className={styles.googleBtn} onClick={handleGoogleRegister} disabled={loading}>
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className={styles.divider}>
                  <span className={styles.dividerLine} />
                  <span className={styles.dividerLabel}>OR</span>
                  <span className={styles.dividerLine} />
                </div>

                {/* Full name */}
                <label className={styles.label}>Full name <span className={styles.required}>*</span></label>
                <div className={styles.fieldWrap}>
                  <span className={styles.fieldIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    className={styles.field}
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <label className={styles.label}>Email <span className={styles.required}>*</span></label>
                <div className={styles.fieldWrap}>
                  <span className={styles.fieldIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    className={styles.field}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <label className={styles.label}>Password <span className={styles.required}>*</span></label>
                <div className={styles.fieldWrap} style={{ marginBottom: 14 }}>
                  <span className={styles.fieldIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="11" width="16" height="9" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </span>
                  <input
                    type={pwVisible ? 'text' : 'password'}
                    className={styles.fieldPw}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className={styles.toggleBtn} onClick={() => setPwVisible(!pwVisible)}>
                    {pwVisible ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>

                <p className={styles.legalText}>
                  By registering you agree to our{' '}
                  <button type="button" onClick={() => openLegal('terms')} className={styles.legalLink} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>Terms of Service</button> and{' '}
                  <button type="button" onClick={() => openLegal('privacy')} className={styles.legalLink} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>Privacy Policy</button>.
                </p>

                <button
                  type="button"
                  className={styles.continueBtn}
                  disabled={!canNext}
                  onClick={() => canNext && setStep(2)}
                >
                  Continue
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>

                <p className={styles.footerText}>
                  Already have an account?{' '}
                  <a href="/login" className={styles.link}>Sign in</a>
                </p>
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div>
                <p className={styles.eyebrow}>Your details</p>
                <h1 className={styles.headline}>Tell us about you</h1>
                <p className={styles.subline}>This helps landlords understand your situation.</p>

                <div className={styles.sectionLabel}>Required</div>

                {/* Nationality + Phone */}
                <div className={styles.row}>
                  <div className={styles.rowCol}>
                    <label className={styles.label}>Nationality <span className={styles.required}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <span className={styles.fieldIcon}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
                        </svg>
                      </span>
                      <select
                        className={styles.select}
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        style={{ color: nationality ? 'var(--text)' : 'var(--placeholder)' }}
                      >
                        <option value="">Select…</option>
                        <option>Germany</option>
                        <option>France</option>
                        <option>Spain</option>
                        <option>Italy</option>
                        <option>Netherlands</option>
                        <option>India</option>
                        <option>China</option>
                        <option>United States</option>
                        <option>Other</option>
                      </select>
                      <span className={styles.selectArrow}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className={styles.rowCol}>
                    <label className={styles.label}>Phone <span className={styles.required}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <span className={styles.fieldIcon}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        className={styles.field}
                        placeholder="+49 …"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Role */}
                <label className={styles.label}>I am a <span className={styles.required}>*</span></label>
                <div className={styles.roleRow}>
                  <button
                    type="button"
                    className={role === 'student' ? styles.roleBtnActive : styles.roleBtn}
                    onClick={() => setRole('student')}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                      <path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
                    </svg>
                    Student
                  </button>
                  <button
                    type="button"
                    className={role === 'employed' ? styles.roleBtnActive : styles.roleBtn}
                    onClick={() => setRole('employed')}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Employed
                  </button>
                </div>

                {/* Student fields */}
                {role === 'student' && (
                  <div>
                    <label className={styles.label}>University <span className={styles.required}>*</span></label>
                    <div className={styles.fieldWrap}>
                      <span className={styles.fieldIcon}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                          <path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        className={styles.field}
                        placeholder="e.g. Technical University of Berlin"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                      />
                    </div>
                    <div className={styles.row}>
                      <div className={styles.rowColWide}>
                        <label className={styles.label}>Program / Course <span className={styles.required}>*</span></label>
                        <input
                          type="text"
                          className={styles.fieldNoIcon}
                          placeholder="e.g. MSc Computer Science"
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                        />
                      </div>
                      <div className={styles.rowCol}>
                        <label className={styles.label}>Start year <span className={styles.required}>*</span></label>
                        <div style={{ position: 'relative' }}>
                          <select
                            className={styles.selectNoIcon}
                            value={startYear}
                            onChange={(e) => setStartYear(e.target.value)}
                            style={{ color: startYear ? 'var(--text)' : 'var(--placeholder)' }}
                          >
                            <option value="">Year…</option>
                            <option>2026</option>
                            <option>2025</option>
                            <option>2024</option>
                            <option>2023</option>
                            <option>2022</option>
                            <option>2021</option>
                          </select>
                          <span className={styles.selectArrow}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employed fields */}
                {role === 'employed' && (
                  <div>
                    <label className={styles.label}>
                      What do you do?{' '}
                      <span style={{ color: '#b3adbf', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <div className={styles.fieldWrap} style={{ marginBottom: 18 }}>
                      <span className={styles.fieldIcon}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="7" width="18" height="13" rx="2" />
                          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        className={styles.field}
                        placeholder="e.g. Software Engineer at Siemens"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Optional why */}
                {role && (
                  <div>
                    <div className={styles.optionalLabel}>Optional</div>
                    <label className={styles.label}>Why UniStay?</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Tell us why you're looking for housing and what you need…"
                      rows={3}
                      value={why}
                      onChange={(e) => setWhy(e.target.value)}
                    />
                  </div>
                )}

                {/* Back + Create */}
                {error && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#c2557a', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>
                )}
                <div className={styles.buttonRow}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(1)} disabled={loading}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M11 6l-6 6 6 6" />
                    </svg>
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.createBtn}
                    disabled={!canCreate || loading}
                    onClick={() => !legalAgreed ? openLegal('terms') : handleCreateAccount()}
                  >
                    {loading ? 'Creating…' : 'Create Account'}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
      </div>
      <LegalModal
        isOpen={legalOpen}
        onClose={() => setLegalOpen(false)}
        initialDoc={legalDoc}
        mode="agree"
        onAgree={() => {
          setLegalAgreed(true);
          setLegalOpen(false);
        }}
        isAgreed={legalAgreed}
      />
    </>
  );
}
