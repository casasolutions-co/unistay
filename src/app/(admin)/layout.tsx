import Sidebar from '@/components/layout/Sidebar'
import { getDashboardCounts } from '@/lib/data'
import { getAdminSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const counts = await getDashboardCounts()
  const session = await getAdminSession()

  return (
    <>
      {/* Mobile gate — shown only on small screens */}
      <div className="mobile-gate" style={{
        height: '100dvh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 32,
        background: '#faf9fc',
        textAlign: 'center',
      }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
        <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 20, color: '#1c1530', letterSpacing: '-.02em' }}>
          Desktop only
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', maxWidth: 280, lineHeight: 1.55 }}>
          The UniStay Admin Console is designed for larger screens. Please open it on a desktop or laptop.
        </div>
      </div>

      {/* Desktop shell — hidden on small screens */}
      <div className="desktop-shell" style={{ height: '100vh', overflow: 'hidden' }}>
        <Sidebar counts={counts} email={session?.email ?? ''} />
        <main
          className="us-scroll"
          style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '30px 38px 50px' }}
        >
          {children}
        </main>
      </div>
    </>
  )
}
