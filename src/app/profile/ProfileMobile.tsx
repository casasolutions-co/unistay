'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import MobileTabBar from '../components/MobileTabBar';
import styles from './ProfileMobile.module.css';

/* ── Icon helpers ─────────────────────────────────────────────── */
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */
function initials(user: User): string {
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

function displayName(user: User): string {
  return user.displayName ?? user.email?.split('@')[0] ?? 'Account';
}

/* ── Verification check icon ──────────────────────────────────── */
function DoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}


/* ── Main component ───────────────────────────────────────────── */
export default function ProfileMobile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '+49 151 234 5678',
    org: 'LMU München',
    role: 'M.Sc. Computer Science',
    graduation: '2026',
  });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setForm((prev) => ({
          ...prev,
          fullName: u.displayName ?? '',
          email: u.email ?? '',
        }));
      }
    });
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const userInitials = user ? initials(user) : '?';
  const userName = user ? displayName(user) : 'Account';

  const fields = [
    { label: 'Full name', key: 'fullName' as const },
    { label: 'Email address', key: 'email' as const, verified: true },
    { label: 'Phone', key: 'phone' as const, verified: true },
    { label: 'University', key: 'org' as const, verified: true },
    { label: 'Programme', key: 'role' as const },
    { label: 'Expected graduation', key: 'graduation' as const },
  ];

  const verifications = [
    {
      label: 'Student email',
      sub: form.email || 'Not set',
      iconBg: '#e9f6ef',
      iconColor: '#1f8a5b',
      done: true,
      icon: 'M22 10 12 5 2 10l10 5 10-5ZM6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5',
    },
    {
      label: 'Phone number',
      sub: 'Verified by SMS',
      iconBg: '#e9f6ef',
      iconColor: '#1f8a5b',
      done: true,
      icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92Z',
    },
    {
      label: 'Government ID',
      sub: 'Boosts host trust',
      iconBg: '#f3effe',
      iconColor: '#6d28d9',
      done: false,
      icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM7 8h4M7 12h6M15 8h2M15 12h2',
    },
    {
      label: 'Proof of enrolment',
      sub: 'Upload current certificate',
      iconBg: '#f3effe',
      iconColor: '#6d28d9',
      done: false,
      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4',
    },
  ];

  return (
    <div className={styles.screen} style={{ position: 'relative' }}>
      {/* Header */}
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => router.back()} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Profile</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.editBtn} ${editing ? styles.editBtnActive : styles.editBtnIdle}`}
            onClick={() => setEditing((e) => !e)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
            {editing ? 'Done' : 'Edit'}
          </button>
          <Link href="/profile" className={styles.settingsBtn} aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Scrollable body */}
      <div className={styles.body}>

        {/* Identity */}
        <div className={styles.identityCard}>
          <div className={styles.avatarWrap}>
            <span className={styles.avatar}>{userInitials}</span>
            <button type="button" className={styles.avatarEditBtn} aria-label="Change photo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </button>
          </div>
          <p className={styles.identityName}>{userName}</p>
          <p className={styles.identityOrg}>LMU München · Munich</p>
          <span className={styles.badge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Verified student
          </span>
        </div>

        {/* Profile strength */}
        <div className={styles.strengthCard}>
          <div className={styles.strengthHeader}>
            <span className={styles.strengthLabel}>Profile strength</span>
            <span className={styles.strengthPct}>75%</span>
          </div>
          <div className={styles.strengthTrack}>
            <div className={styles.strengthFill} style={{ width: '75%' }} />
          </div>
        </div>

        {/* Personal information */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Personal information</p>
          <div className={styles.fields}>
            {fields.map((f) => (
              <div key={f.key}>
                <label className={styles.fieldLabel}>{f.label}</label>
                {editing ? (
                  <input
                    type="text"
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className={styles.fieldInput}
                  />
                ) : (
                  <div className={styles.fieldValue}>
                    {form[f.key] || '—'}
                    {f.verified && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8a5b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <button type="button" className={styles.saveBtn} onClick={() => setEditing(false)}>
              Save changes
            </button>
          )}
        </div>

        {/* Verification */}
        <div className={styles.card}>
          <p className={styles.cardTitle} style={{ marginBottom: 4 }}>Verification</p>
          <p className={styles.cardSub}>Verified profiles get priority replies.</p>
          <div className={styles.verifyList}>
            {verifications.map((v) => (
              <div key={v.label} className={styles.verifyRow}>
                <span className={styles.verifyIcon} style={{ background: v.iconBg, color: v.iconColor }}>
                  <Icon d={v.icon} />
                </span>
                <div className={styles.verifyBody}>
                  <p className={styles.verifyLabel}>{v.label}</p>
                  <p className={styles.verifySub}>{v.sub}</p>
                </div>
                {v.done ? (
                  <span className={styles.verifyDone}><DoneIcon /></span>
                ) : (
                  <button type="button" className={styles.verifyBtn}>Verify</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Housing preferences */}
        <div className={styles.card}>
          <p className={styles.cardTitle}>Housing preferences</p>
          <div className={styles.prefGrid}>
            {[
              { label: 'Budget', value: '€600–950' },
              { label: 'Move-in', value: 'Oct 2026' },
              { label: 'Duration', value: '6–12 mo' },
              { label: 'Area', value: 'Maxvorstadt' },
            ].map((p) => (
              <div key={p.label} className={styles.prefStat}>
                <p className={styles.prefStatLabel}>{p.label}</p>
                <p className={styles.prefStatValue}>{p.value}</p>
              </div>
            ))}
          </div>
          <div className={styles.tags}>
            {['Studio', 'Shared (WG)', 'Furnished', 'Pet-friendly', 'Near U-Bahn'].map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        </div>

        {/* Log out */}
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Log out
        </button>
      </div>

      <MobileTabBar active="profile" />
    </div>
  );
}
