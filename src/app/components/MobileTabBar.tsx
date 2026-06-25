'use client';

import Link from 'next/link';
import styles from './MobileTabBar.module.css';

export type MobileTab = 'explore' | 'saved' | 'messages' | 'profile';

interface Tab {
  key: MobileTab;
  label: string;
  href: string;
  icon: string;
}

const TABS: Tab[] = [
  {
    key: 'explore',
    label: 'Explore',
    href: '/search',
    icon: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  },
  {
    key: 'saved',
    label: 'Saved',
    href: '#',
    icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z',
  },
  {
    key: 'messages',
    label: 'Messages',
    href: '/messages',
    icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  },
  {
    key: 'profile',
    label: 'Profile',
    href: '/settings',
    icon: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  },
];

interface MobileTabBarProps {
  active: MobileTab;
}

export default function MobileTabBar({ active }: MobileTabBarProps) {
  return (
    <div className={styles.tabBar}>
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={styles.tab}
            style={{ color: isActive ? '#6d28d9' : '#b0aabf' }}
          >
            <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            <span className={styles.label} style={{ fontWeight: isActive ? 700 : 600 }}>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
