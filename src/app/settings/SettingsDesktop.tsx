'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppNav from '../components/AppNav';
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
interface ToggleRowDef {
  kind: 'toggle';
  icon: string;
  label: string;
  sub?: string;
  checked: boolean;
  onToggle: () => void;
}
interface SelectRowDef {
  kind: 'select';
  icon: string;
  label: string;
  options: string[];
  value: string;
  onPick: (v: string) => void;
}
type RowDef = NavRowDef | ToggleRowDef | SelectRowDef;

function Row({ row }: { row: RowDef }) {
  if (row.kind === 'nav') {
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

  if (row.kind === 'toggle') {
    return (
      <div className={styles.row}>
        <span className={styles.rowIconWrap}><Icon d={row.icon} /></span>
        <div className={styles.rowBody}>
          <div className={styles.rowLabel}>{row.label}</div>
          {row.sub && <div className={styles.rowSub}>{row.sub}</div>}
        </div>
        <button
          type="button"
          className={styles.toggle}
          style={{ background: row.checked ? '#6d28d9' : '#dcd6e8' }}
          onClick={row.onToggle}
          aria-label={row.label}
        >
          <span className={styles.toggleKnob} style={{ left: row.checked ? 25 : 3 }} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <span className={styles.rowIconWrap}><Icon d={row.icon} /></span>
      <div className={styles.rowBody}>
        <div className={styles.rowLabel}>{row.label}</div>
      </div>
      <div className={styles.selectOptions}>
        {row.options.map(o => {
          const active = row.value === o;
          return (
            <button
              key={o}
              type="button"
              className={`${styles.selectOption} ${active ? styles.selectOptionActive : ''}`}
              onClick={() => row.onPick(o)}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main component ── */
interface SettingsDesktopProps {
  onOpenLegal: () => void;
}

export default function SettingsDesktop({ onOpenLegal }: SettingsDesktopProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [toggles, setToggles] = useState({ activityStatus: true, emailDigest: false });
  const [appearance, setAppearance] = useState('Light');

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  const flip = (key: keyof typeof toggles) =>
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const scrollTo = (anchor: string) => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const userInitials = user ? initials(user) : '?';
  const userName = user ? displayName(user) : 'Account';

  const groups: { anchor: string; title: string; subtitle: string; icon: string; rows: RowDef[] }[] = [
    {
      anchor: 'privacy',
      title: 'Privacy & security',
      subtitle: 'Control who can see your activity and data.',
      icon: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
      rows: [
        { kind: 'nav', icon: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', label: 'Profile visibility', value: 'Hosts only', href: '#' },
        { kind: 'toggle', icon: 'M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', label: 'Show activity status', sub: 'Let others see when you’re online', checked: toggles.activityStatus, onToggle: () => flip('activityStatus') },
        { kind: 'nav', icon: 'M18.36 6.64A9 9 0 1 1 5.64 6.64M12 2v10', label: 'Blocked users', value: '0', href: '#' },
        { kind: 'nav', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', label: 'Download my data', href: '#' },
      ],
    },
    {
      anchor: 'preferences',
      title: 'Preferences',
      subtitle: 'Language, currency and appearance.',
      icon: 'M5 8h14M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v8a2 2 0 0 0 2 2h7m3 0 3-3-3-3m3 3h-6',
      rows: [
        { kind: 'nav', icon: 'M5 8h14M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v8a2 2 0 0 0 2 2h7m3 0 3-3-3-3m3 3h-6', label: 'Language', value: 'English', href: '#' },
        { kind: 'nav', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20', label: 'Currency', value: 'EUR €', href: '#' },
        { kind: 'select', icon: 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36A5.4 5.4 0 0 1 12 3Z', label: 'Appearance', options: ['Light', 'Dark', 'System'], value: appearance, onPick: setAppearance },
        { kind: 'toggle', icon: 'M4 4h16v16H4z M4 9h16 M9 4v16', label: 'Weekly email digest', sub: 'Summary of new listings and messages', checked: toggles.emailDigest, onToggle: () => flip('emailDigest') },
      ],
    },
    {
      anchor: 'activity',
      title: 'Activity',
      subtitle: 'Your saved homes, applications and messages.',
      icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z',
      rows: [
        { kind: 'nav', icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z', label: 'Saved homes', value: '12', href: '/saved' },
        { kind: 'nav', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4', label: 'Applications', value: '3', href: '/messages' },
        { kind: 'nav', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: 'Messages', value: '5', href: '/messages' },
      ],
    },
    {
      anchor: 'support',
      title: 'Support',
      subtitle: 'Get help or review our policies.',
      icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
      rows: [
        { kind: 'nav', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', label: 'Help center', href: '/help' },
        { kind: 'nav', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: 'Contact us', href: '/contact' },
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
              <button type="button" className={styles.dangerBtn}>Delete account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
