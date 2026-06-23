'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './LoginMobile.module.css';

async function syncUser(token: string): Promise<boolean> {
  const res = await fetch('/api/auth/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error('Sync failed');
  const { user } = await res.json();
  return !!user?.profile_complete;
}

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

const ISignInArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IEmail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const IPassword = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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


interface LoginMobileProps {
  onOpenLegal: (doc: 'terms' | 'privacy') => void;
}

export default function LoginMobile({ onOpenLegal }: LoginMobileProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => router.push('/');

  const handleSignIn = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      const profileComplete = await syncUser(token);
      router.push(profileComplete ? '/search' : '/register/complete');
    } catch {
      setError('Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const token = await cred.user.getIdToken();
      const profileComplete = await syncUser(token);
      router.push(profileComplete ? '/search' : '/register/complete');
    } catch {
      setError('Google sign-in failed.');
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
            onClick={handleBack}
            aria-label="Back"
          >
            <IBack />
          </button>
        </div>

        {/* Banner Content */}
        <div className={styles.bannerContent}>
          <div className={styles.logoRow}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11.2 12 4l9 7.2" />
              <path d="M5.5 9.8V20h13V9.8" />
              <path d="M10 20v-5h4v5" />
            </svg>
            <span className={styles.logoText}>UniStay</span>
          </div>
          <p className={styles.bannerSubTitle}>Student portal</p>
          <h1 className={styles.bannerTitle}>Welcome back.</h1>
          <p className={styles.bannerDesc}>
            Pick up where you left off — manage stays and explore listings.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM SHEET
          ══════════════════════════════════════════════════════════ */}
      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <div className={styles.handle} />
        </div>

        <form onSubmit={handleSignIn} className={styles.scrollContent}>
          {/* Email field */}
          <label className={styles.label}>Email address</label>
          <div className={styles.fieldWrap}>
            <span
              className={styles.fieldIcon}
              style={{ color: focusedField === 'email' || email ? 'var(--brand)' : '#b0aabf' }}
            >
              <IEmail />
            </span>
            <input
              type="email"
              inputMode="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className={styles.field}
              required
            />
          </div>

          {/* Password field */}
          <div className={styles.pwLabelRow}>
            <label className={styles.label}>Password</label>
            <a href="#" className={styles.forgotLink}>Forgot?</a>
          </div>
          <div className={styles.fieldWrap}>
            <span
              className={styles.fieldIcon}
              style={{ color: focusedField === 'password' || password ? 'var(--brand)' : '#b0aabf' }}
            >
              <IPassword />
            </span>
            <input
              type={pwVisible ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className={styles.fieldPw}
              required
            />
            <button
              type="button"
              onClick={() => setPwVisible(!pwVisible)}
              className={styles.pwToggle}
              aria-label={pwVisible ? 'Hide password' : 'Show password'}
            >
              {pwVisible ? <IEye /> : <IEyeOff />}
            </button>
          </div>

          {error && <p style={{ fontSize: 13, fontWeight: 600, color: '#c2557a', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

          {/* Submit */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
            <ISignInArrow />
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerLabel}>Or</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Social login buttons */}
          <div className={styles.socialRow}>
            <button type="button" className={styles.socialBtn} onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Google
            </button>
          </div>

          {/* Footer link to register */}
          <p className={styles.footerText} style={{ marginBottom: 14 }}>
            New to UniStay?{' '}
            <a href="/register" className={styles.footerLink}>
              Create account
            </a>
          </p>

          <p className={styles.footerText} style={{ fontSize: '11px', color: 'var(--text-soft)', marginTop: 8 }}>
            By continuing, you agree to UniStay&apos;s{' '}
            <button type="button" onClick={() => onOpenLegal('terms')} className={styles.footerLink} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontSize: 'inherit' }}>Terms</button> and{' '}
            <button type="button" onClick={() => onOpenLegal('privacy')} className={styles.footerLink} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontSize: 'inherit' }}>Privacy Policy</button>.
          </p>
        </form>
      </div>
    </div>
  );
}
