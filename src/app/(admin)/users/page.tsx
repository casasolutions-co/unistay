import { Suspense } from 'react'
import { getUsers } from '@/lib/data'
import { verifyUser, rejectUser, banUser, unbanUser } from '@/lib/actions'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterPills from '@/components/ui/FilterPills'
import SearchInput from '@/components/ui/SearchInput'
import ActionBtn from '@/components/ui/ActionBtn'
import UserRowActions from './UserRowActions'
import Link from 'next/link'
import { userStatus } from '@/lib/utils'

const FILTER_PILLS = [
  { label: 'All',        value: 'all',        href: '/users' },
  { label: 'Unverified', value: 'unverified',  href: '/users?filter=unverified' },
  { label: 'Pending',    value: 'pending',     href: '/users?filter=pending' },
  { label: 'Verified',   value: 'verified',    href: '/users?filter=verified' },
  { label: 'Rejected',   value: 'rejected',    href: '/users?filter=rejected' },
  { label: 'Banned',     value: 'banned',      href: '/users?filter=banned' },
]

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const { filter = 'all', q = '' } = await searchParams
  const users = await getUsers({ filter, q })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Users</h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: 0 }}>Verify new accounts, review uploaded ID, or remove a user.</p>
        </div>
        <Suspense>
          <SearchInput placeholder="Search name or email…" defaultValue={q} />
        </Suspense>
      </div>

      <FilterPills pills={FILTER_PILLS} current={filter} />

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fbfafd' }}>
              {['USER', 'UNIVERSITY', 'JOINED', 'STATUS', 'DOCS', 'ACTIONS'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 5 ? 'right' : 'left', padding: i === 0 || i === 5 ? '13px 20px' : '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const st = userStatus(u.status)
              const verify = verifyUser.bind(null, u.id)
              const reject = rejectUser.bind(null, u.id)
              const ban    = banUser.bind(null, u.id)
              const unban  = unbanUser.bind(null, u.id)
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #f5f2fa' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar name={u.name} size={34} fontSize={12.5} />
                      <div style={{ minWidth: 0 }}>
                        <Link href={`/users/${u.id}`} style={{ fontWeight: 700, color: '#1c1530', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap' }}>{u.name}</Link>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600 }}>{u.university}</td>
                  <td style={{ padding: '13px 16px', color: '#9a94a8', fontWeight: 600 }}>{u.joined}</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge label={st.label} bg={st.bg} color={st.color} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <Link href={`/users/${u.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#4a4654', border: '1px solid #ece8f3', borderRadius: 8, padding: '5px 10px', textDecoration: 'none' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      View
                    </Link>
                  </td>
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                      <UserRowActions status={u.status} verify={verify} reject={reject} ban={ban} unban={unban} size="sm" />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9a94a8', fontWeight: 600, fontSize: 14 }}>No users match this view.</div>
        )}
      </div>
    </>
  )
}
