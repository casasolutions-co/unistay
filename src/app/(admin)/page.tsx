import Link from 'next/link'
import { getDashboardCounts, getAttentionUsers, getAttentionListings } from '@/lib/data'
import { verifyUser, approveListing } from '@/lib/actions'
import Avatar from '@/components/ui/Avatar'
import ActionBtn from '@/components/ui/ActionBtn'
import { userStatus, listingStatus, thumbBg } from '@/lib/utils'

export default async function DashboardPage() {
  const [counts, attentionUsers, attentionListings] = await Promise.all([
    getDashboardCounts(),
    getAttentionUsers(),
    getAttentionListings(),
  ])

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Dashboard</h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: '0 0 24px' }}>What needs your attention across UniStay right now.</p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard href="/users" count={counts.users} label="Unverified users" iconColor="#6d28d9" iconBg="#f3effe" icon="users" hoverBorder="#ddd0f6" />
        <StatCard href="/listings" count={counts.listings} label="Listings pending approval" iconColor="#92660b" iconBg="#fff3d6" icon="listing" hoverBorder="#f5d68e" />
        <StatCard href="/messages" count={counts.messages} label="Flagged conversations" iconColor="#b91c1c" iconBg="#fdecec" icon="message" hoverBorder="#f3c6c6" />
        <StatCard href="/documents" count={counts.documents} label="Documents to review" iconColor="#0f766e" iconBg="#e6fbf6" icon="doc" hoverBorder="#99e6d8" />
      </div>

      {/* Attention panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* New sign-ups */}
        <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1eef7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 15 }}>New sign-ups awaiting verification</span>
            <Link href="/users?filter=unverified" style={{ fontSize: 12.5, fontWeight: 700, color: '#6d28d9', textDecoration: 'none' }}>View all ›</Link>
          </div>
          {attentionUsers.length === 0 && (
            <div style={{ padding: '20px', fontSize: 13, fontWeight: 600, color: '#b0aabf' }}>All users verified.</div>
          )}
          {attentionUsers.map(u => {
            const verify = verifyUser.bind(null, u.id)
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f5f2fa' }}>
                <Avatar name={u.name} size={32} fontSize={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1530' }}>{u.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>{u.joined}</div>
                </div>
                <ActionBtn action={verify} label="Verify" size="sm" />
              </div>
            )
          })}
        </div>

        {/* Pending listings */}
        <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1eef7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 15 }}>Listings awaiting approval</span>
            <Link href="/listings?filter=pending" style={{ fontSize: 12.5, fontWeight: 700, color: '#6d28d9', textDecoration: 'none' }}>View all ›</Link>
          </div>
          {attentionListings.length === 0 && (
            <div style={{ padding: '20px', fontSize: 13, fontWeight: 600, color: '#b0aabf' }}>No listings pending.</div>
          )}
          {attentionListings.map(l => {
            const approve = approveListing.bind(null, l.id)
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f5f2fa' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: thumbBg(l.thumb), flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1530', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>{l.host} · {l.price}</div>
                </div>
                <ActionBtn action={approve} label="Approve" size="sm" />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

type IconType = 'users' | 'listing' | 'message' | 'doc'

function StatCard({ href, count, label, iconColor, iconBg, icon, hoverBorder }: {
  href: string; count: number; label: string
  iconColor: string; iconBg: string; icon: IconType; hoverBorder: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: '18px 20px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: iconBg, display: 'grid', placeItems: 'center', marginBottom: 12 }}>
        <StatIcon type={icon} color={iconColor} />
      </div>
      <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 26, color: '#1c1530' }}>{count}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6b6675', marginTop: 2 }}>{label}</div>
    </Link>
  )
}

function StatIcon({ type, color }: { type: IconType; color: string }) {
  if (type === 'users') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    </svg>
  )
  if (type === 'listing') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M10 9h4" />
    </svg>
  )
  if (type === 'message') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    </svg>
  )
}
