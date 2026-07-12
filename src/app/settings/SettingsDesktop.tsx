'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppNav from '../components/AppNav';
import DeleteAccountModal from '../components/DeleteAccountModal';
import { useSavedListings } from '@/lib/useSavedListings';
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

export default function SettingsDesktop({ onOpenLegal }: SettingsDesktopProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { savedIds } = useSavedListings();

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
          if (cancelled || !d.user?.verification_status) return;
          setVerificationStatus(d.user.verification_status);
        })
        .catch(() => {})
    );
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user.getIdToken().then(token =>
      fetch('/api/chat/unread-count', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then((d: { count?: number }) => {
          if (cancelled) return;
          setUnreadCount(d.count ?? 0);
        })
        .catch(() => {})
    );
    return () => { cancelled = true; };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const scrollTo = (anchor: string) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const userInitials = user ? initials(user) : '?';
  const userName = user ? displayName(user) : 'Account';

  const verificationLabel = verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'In review' : 'Not verified';

  const groups: { anchor: string; title: string; subtitle: string; icon: string; rows: RowDef[] }[] = [
    {
      anchor: 'account',
      title: 'Account',
      subtitle: 'Your identity verification status.',
      icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
      rows: [
        { kind: 'nav', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', label: 'Identity verification', value: verificationLabel, href: '/verify' },
        { kind: 'nav', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4', label: 'Documents', href: '/documents' },
      ],
    },
    {
      anchor: 'activity',
      title: 'Activity',
      subtitle: 'Your saved homes and messages.',
      icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z',
      rows: [
        { kind: 'nav', icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z', label: 'Saved homes', value: String(savedIds.length), href: '/saved' },
        { kind: 'nav', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: 'Messages', value: unreadCount !== null ? String(unreadCount) : undefined, href: '/messages' },
      ],
    },
    {
      anchor: 'support',
      title: 'Help center',
      subtitle: 'Get help or review our policies.',
      icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
      rows: [
        { kind: 'nav', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', label: 'Help center', href: '/help' },
        { kind: 'nav', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', label: 'Terms & privacy', onPress: onOpenLegal },
      ],
    },
  ];

  return (
    <div className={styles.page}>
      <AppNav />

      <div className={styles.inner}>
        <div className={styles.workspace}>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <Link href="/profile" className={styles.accountCard}>
              <span className={styles.accountAvatar}>{userInitials}</span>
              <div className={styles.accountInfo}>
                <p className={styles.accountName}>{userName}</p>
                <p className={styles.accountSub}>View and edit profile</p>
              </div>
              <IChevronRight />
            </Link>

            <div className={styles.sectionNav}>
              {groups.map(g => (
                <button key={g.anchor} type="button" className={styles.sectionNavItem} onClick={() => scrollTo(g.anchor)}>
                  <span className={styles.sectionNavIcon}><Icon d={g.icon} size={15} /></span>
                  {g.title}
                </button>
              ))}
            </div>

            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Log out
            </button>
            <div className={styles.versionText}>UniStay · v3.2.0</div>
          </aside>

          {/* Content */}
          <div className={styles.content}>
            {groups.map(g => (
              <div id={g.anchor} key={g.anchor} className={styles.groupCard}>
                <div className={styles.groupHeader}>
                  <div className={styles.groupTitle}>{g.title}</div>
                  <div className={styles.groupSubtitle}>{g.subtitle}</div>
                </div>
                {g.rows.map((r, i) => (
                  <div key={i} className={i > 0 ? styles.rowBordered : undefined}>
                    <Row row={r} />
                  </div>
                ))}
              </div>
            ))}

            {/* Danger zone */}
            <div className={styles.dangerZone}>
              <div>
                <div className={styles.dangerTitle}>Delete account</div>
                <div className={styles.dangerSub}>Permanently remove your account and all associated data.</div>
              </div>
              <button type="button" className={styles.dangerBtn} onClick={() => setDeleteModalOpen(true)}>Delete account</button>
            </div>
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <DeleteAccountModal user={user} onClose={() => setDeleteModalOpen(false)} />
      )}
    </div>
  );
}
