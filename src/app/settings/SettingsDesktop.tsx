'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppNav from '../components/AppNav';
import DeleteAccountModal from '../components/DeleteAccountModal';
import styles from './SettingsDesktop.module.css';

/* ── Icon helper ── */
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IChevronRight = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#c4bdd2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/* ── Helpers ── */
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

/* ── Row types ── */
interface NavRowDef {
  kind: 'nav';
  icon: string;
  label: string;
  value?: string;
  sub?: string;
  href?: string;
  onPress?: () => void;
  danger?: boolean;
}
type RowDef = NavRowDef;

function Row({ row }: { row: RowDef }) {
  const inner = (
    <>
      <span className={`${styles.rowIconWrap} ${row.danger ? styles.rowIconWrapDanger : ''}`}>
        <Icon d={row.icon} />
      </span>
      <div className={styles.rowBody}>
        <div className={`${styles.rowLabel} ${row.danger ? styles.rowLabelDanger : ''}`}>{row.label}</div>
        {row.sub && <div className={styles.rowSub}>{row.sub}</div>}
      </div>
      {row.value && <span className={styles.rowValue}>{row.value}</span>}
      <IChevronRight />
    </>
  );

  if (row.onPress) {
    return (
      <button type="button" className={styles.row} onClick={row.onPress} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={row.href ?? '#'} className={styles.row}>
      {inner}
    </Link>
  );
}

/* ── Main component ── */
interface SettingsDesktopProps {
  onOpenLegal: () => void;
}

function Group({ title, subtitle, rows }: { title: string; subtitle: string; rows: RowDef[] }) {
  return (
    <div className={styles.groupCard}>
      <div className={styles.groupHeader}>
        <div className={styles.groupTitle}>{title}</div>
        <div className={styles.groupSubtitle}>{subtitle}</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.label} className={i > 0 ? styles.rowBordered : undefined}>
          <Row row={r} />
        </div>
      ))}
    </div>
  );
}

export default function SettingsDesktop({ onOpenLegal }: SettingsDesktopProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user.getIdToken().then(token =>
      fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then((d: { user?: { verification_status?: string } }) => {
          if (!cancelled) setVerificationStatus(d.user?.verification_status ?? 'unverified');
        })
        .catch(() => { if (!cancelled) setVerificationStatus('unverified'); })
    );
    return () => { cancelled = true; };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const userInitials = user ? initials(user) : '?';
  const userName = user ? displayName(user) : 'Account';

  const verificationLabel = verificationStatus === null ? 'Checking…' : verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'In review' : 'Not verified';

  const profileRows: RowDef[] = [
    { kind: 'nav', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', label: 'Identity verification', value: verificationLabel, href: '/verify?next=/settings' },
    { kind: 'nav', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4', label: 'Documents', href: '/documents' },
  ];

  const supportRows: RowDef[] = [
    { kind: 'nav', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', label: 'Help center', href: '/help' },
    { kind: 'nav', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', label: 'Terms & privacy', onPress: onOpenLegal },
  ];

  const accountRows: RowDef[] = [
    { kind: 'nav', icon: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9', label: 'Log out', sub: user?.email ?? undefined, onPress: handleLogout },
    { kind: 'nav', icon: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6', label: 'Delete account', sub: 'Permanently remove your account and all associated data.', onPress: () => setDeleteModalOpen(true), danger: true },
  ];

  return (
    <div className={styles.page}>
      <AppNav />

      <div className={styles.inner}>
        <div className={styles.workspace}>

          {/* Left: you */}
          <aside className={styles.sidebar}>
            <Link href="/profile" className={styles.accountCard}>
              <span className={styles.accountAvatar}>{userInitials}</span>
              <div className={styles.accountInfo}>
                <p className={styles.accountName}>{userName}</p>
                <p className={styles.accountSub}>View and edit profile</p>
              </div>
              <IChevronRight />
            </Link>
            <Group title="Verification" subtitle="Your identity and documents." rows={profileRows} />
          </aside>

          {/* Right: account */}
          <div className={styles.content}>
            <Group title="Support" subtitle="Get help or review our policies." rows={supportRows} />
            <Group title="Account" subtitle="Sign out or close your account." rows={accountRows} />
            <div className={styles.versionText}>UniStay · v3.2.0</div>
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <DeleteAccountModal user={user} onClose={() => setDeleteModalOpen(false)} />
      )}
    </div>
  );
}
