'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: '/users',
    label: 'Users',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/listings',
    label: 'Listings',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
      </svg>
    ),
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
]

interface SidebarProps {
  counts: { users: number; listings: number; messages: number; documents: number }
}

export default function Sidebar({ counts }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const badgeCounts: Record<string, number> = {
    '/users': counts.users,
    '/listings': counts.listings,
    '/messages': counts.messages,
    '/documents': counts.documents,
  }

  return (
    <aside style={{
      flex: 'none',
      width: 232,
      background: '#fff',
      borderRight: '1px solid #ece8f3',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 14px',
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 16px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11.2 12 4l9 7.2" />
          <path d="M5.5 9.8V20h13V9.8" />
          <path d="M10 20v-5h4v5" />
        </svg>
        <div>
          <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 17, letterSpacing: '-.02em', color: '#1c1530' }}>UniStay</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9a94a8', letterSpacing: '.02em', marginTop: -2 }}>ADMIN CONSOLE</div>
        </div>
      </div>

      <div style={{ height: 1, background: '#f1eef7', margin: '4px 8px 12px' }} />

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV.map(item => {
          const active = isActive(item.href)
          const badge = badgeCounts[item.href]
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '10px 12px',
                borderRadius: 11,
                background: active ? '#6d28d9' : 'transparent',
                color: active ? '#fff' : '#4a4654',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                transition: 'opacity .15s',
              }}
            >
              {item.icon}
              {item.label}
              {badge ? (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 800,
                  background: active ? 'rgba(255,255,255,.25)' : '#f3effe',
                  color: active ? '#fff' : '#6d28d9',
                  borderRadius: 999,
                  padding: '1px 8px',
                }}>
                  {badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      {/* Admin user */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px 4px', borderTop: '1px solid #f1eef7' }}>
        <span style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg,#312942,#1c1530)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 13, color: '#fff',
          flex: 'none',
        }}>A</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1530', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin user</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#9a94a8' }}>Super admin</div>
        </div>
      </div>
    </aside>
  )
}
