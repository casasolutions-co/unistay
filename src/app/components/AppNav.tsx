'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './AppNav.module.css';

/* ── Icons ── */
const IChevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function MenuIcon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ILogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

/* ── Helpers ── */
function initials(user: User | null): string {
  if (!user) return '';
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

const MENU_ITEMS = [
  { label: 'My account',      path: '/settings', iconPath: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' },
  { label: 'Saved homes',     path: '/saved',   iconPath: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z' },
  { label: 'Messages',        path: '/messages', iconPath: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', badge: '3' },
  { label: 'My applications', path: '#',         iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4' },
];

/* ── Props ── */
interface AppNavProps {
  centerSlot?: React.ReactNode;
}

export default function AppNav({ centerSlot }: AppNavProps) {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setOpen(false);
    router.push('/');
  };

  return (
    <nav className={styles.nav}>
      {/* Brand */}
      <Link href="/" className={styles.brand}>
        <Image src="/primary-logo.png" alt="UniStay" width={2049} height={1772} style={{ height: 40, width: 'auto' }} priority />
      </Link>

      {/* Optional center slot (e.g. search bar) */}
      {centerSlot && <div className={styles.center}>{centerSlot}</div>}

      {/* Right */}
      <div className={styles.right}>
        {authUser && (
          <Link href="/list" className={styles.listBtn}>
            <IPlus /> List your place
          </Link>
        )}

        {/* Auth section — only render after auth state resolves to avoid flash */}
        {authReady && (
          authUser ? (
            <div className={styles.avatarWrap} ref={wrapRef}>
              <button
                type="button"
                className={styles.avatarBtn}
                onClick={() => setOpen(o => !o)}
                aria-label="Account menu"
              >
                <span className={styles.avatarInitials}>{initials(authUser)}</span>
                <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
                  <IChevron open={open} />
                </span>
              </button>

              {open && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownProfile}>
                    <span className={styles.dropdownProfileInitials}>{initials(authUser)}</span>
                    <div style={{ minWidth: 0 }}>
                      <span className={styles.dropdownName}>
                        {authUser.displayName ?? authUser.email?.split('@')[0] ?? 'Account'}
                      </span>
                      <span className={styles.dropdownEmail}>{authUser.email}</span>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  {MENU_ITEMS.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      className={styles.menuItem}
                      onClick={() => { setOpen(false); router.push(item.path); }}
                    >
                      <span className={styles.menuItemIcon}><MenuIcon path={item.iconPath} /></span>
                      <span>{item.label}</span>
                      {item.badge && <span className={styles.menuItemBadge}>{item.badge}</span>}
                    </button>
                  ))}

                  <div className={styles.divider} />

                  <button type="button" className={styles.logoutItem} onClick={handleLogout}>
                    <span className={styles.menuItemIcon}><ILogout /></span>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className={styles.loginBtn}>Login / Register</Link>
          )
        )}
      </div>
    </nav>
  );
}
