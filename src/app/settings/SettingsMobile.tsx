'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import MobileTabBar from '../components/MobileTabBar';
import DeleteAccountModal from '../components/DeleteAccountModal';
import styles from './SettingsMobile.module.css';

/* ── Icon helpers ─────────────────────────────────────────────── */
function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}


const IChevronRight = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c4bdd2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ILogout = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

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

/* ── Types ────────────────────────────────────────────────────── */
interface NavRowProps {
  icon: string;
  label: string;
  value?: string;
  href?: string;
  danger?: boolean;
  onPress?: () => void;
}

/* ── Row components ───────────────────────────────────────────── */
function NavRow({ icon, label, value, href = '#', danger, onPress }: NavRowProps) {
  const inner = (
    <>
      <span className={`${styles.rowIconWrap} ${danger ? styles.rowIconWrapDanger : ''}`}>
        <Icon d={icon} />
      </span>
      <div className={styles.rowBody}>
        <p className={`${styles.rowLabel} ${danger ? styles.rowLabelDanger : ''}`}>{label}</p>
      </div>
      {value && <span className={styles.rowValue}>{value}</span>}
      <IChevronRight />
    </>
  );

  if (onPress) {
    return (
      <button type="button" className={`${styles.row} ${styles.navRow}`} onClick={onPress} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href} className={`${styles.row} ${styles.navRow}`}>
      {inner}
    </Link>
  );
}

/* ── Main component ───────────────────────────────────────────── */
interface SettingsMobileProps {
  onOpenLegal: () => void;
}

export default function SettingsMobile({ onOpenLegal }: SettingsMobileProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user.getIdToken().then(token =>
      fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then((d: { user?: { verification_status?: string } }) => {
          if (cancelled || !d.user?.verification_status) return;
          setVerificationStatus(d.user.verification_status);
        })
        .catch(() => {})
    );
    return () => { cancelled = true; };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const userInitials = user ? initials(user) : '?';
  const userName = user ? displayName(user) : 'Account';
  const verificationLabel = verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'In review' : 'Not verified';

  if (user === null) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Profile</h1>
        </div>
        <div className={styles.signedOutBody}>
          <span className={styles.signedOutIcon}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            </svg>
          </span>
          <h2 className={styles.signedOutTitle}>You&apos;re not signed in</h2>
          <p className={styles.signedOutSub}>Sign in to view and manage your profile.</p>
          <Link href="/login" className={styles.signInBtn}>Sign in</Link>
          <Link href="/register" className={styles.createLink}>
            New to UniStay? <span>Create account</span>
          </Link>
        </div>
        <MobileTabBar active="profile" />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Profile</h1>
      </div>

      {/* Scrollable body */}
      <div className={styles.body}>

        {/* Account summary */}
        <Link href="/profile" className={styles.accountCard}>
          <span className={styles.accountAvatar}>{userInitials}</span>
          <div className={styles.accountInfo}>
            <p className={styles.accountName}>{userName}</p>
            <p className={styles.accountSub}>View and edit profile</p>
          </div>
          <IChevronRight />
        </Link>

        {/* Account */}
        <div className={styles.group}>
          <p className={styles.groupTitle}>Account</p>
          <div className={styles.groupCard}>
            <NavRow
              icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
              label="Identity verification"
              value={verificationLabel}
              href="/verify"
            />
          </div>
        </div>

        {/* Activity */}
        <div className={styles.group}>
          <p className={styles.groupTitle}>Activity</p>
          <div className={styles.groupCard}>
            <NavRow
              icon="M3 11.2 12 4l9 7.2 M5.5 9.8V20h13V9.8"
              label="My listings"
              href="/my-listings"
            />
            <NavRow
              icon="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"
              label="Saved homes"
              value="12"
            />
            <NavRow
              icon="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              label="Messages"
              value="5"
              href="/messages"
            />
          </div>
        </div>

        {/* Help center */}
        <div className={styles.group}>
          <p className={styles.groupTitle}>Help center</p>
          <div className={styles.groupCard}>
            <NavRow
              icon="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"
              label="Help center"
              href="/help"
            />
            <NavRow
              icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"
              label="Terms &amp; privacy"
              onPress={onOpenLegal}
            />
          </div>
        </div>

        {/* Log out */}
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <ILogout />
          Log out
        </button>
        <button type="button" className={styles.deleteBtn} onClick={() => setDeleteModalOpen(true)}>Delete account</button>

        <p className={styles.versionText}>UniStay · v3.2.0</p>
      </div>

      <MobileTabBar active="profile" />

      {deleteModalOpen && (
        <DeleteAccountModal user={user} onClose={() => setDeleteModalOpen(false)} />
      )}
    </div>
  );
}
