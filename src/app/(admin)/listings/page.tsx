import { Suspense } from 'react'
import Link from 'next/link'
import { getListings } from '@/lib/data'
import { approveListing, rejectListing, removeListing, restoreListing } from '@/lib/actions'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterPills from '@/components/ui/FilterPills'
import SearchInput from '@/components/ui/SearchInput'
import ActionBtn from '@/components/ui/ActionBtn'
import { listingStatus, thumbBg } from '@/lib/utils'

const FILTER_PILLS = [
  { label: 'All',      value: 'all',      href: '/listings' },
  { label: 'Pending',  value: 'pending',  href: '/listings?filter=pending' },
  { label: 'Approved', value: 'approved', href: '/listings?filter=approved' },
  { label: 'Removed',  value: 'removed',  href: '/listings?filter=removed' },
]

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const { filter = 'all', q = '' } = await searchParams
  const listings = await getListings({ filter, q })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Listings</h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: 0 }}>Approve new listings before they go live, or remove ones that break the rules.</p>
        </div>
        <Suspense>
          <SearchInput placeholder="Search title or host…" defaultValue={q} />
        </Suspense>
      </div>

      <FilterPills pills={FILTER_PILLS} current={filter} />

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fbfafd' }}>
              {['LISTING', 'HOST', 'PRICE', 'SUBMITTED', 'STATUS', 'ACTIONS'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 5 ? 'right' : 'left', padding: i === 0 || i === 5 ? '13px 20px' : '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map(l => {
              const st = listingStatus(l.status)
              const approve = approveListing.bind(null, l.id)
              const reject  = rejectListing.bind(null, l.id)
              const remove  = removeListing.bind(null, l.id)
              const restore = restoreListing.bind(null, l.id)
              return (
                <tr key={l.id} style={{ borderBottom: '1px solid #f5f2fa' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 38, height: 38, borderRadius: 10, background: thumbBg(l.thumb), flex: 'none' }} />
                      <div style={{ minWidth: 0 }}>
                        <Link href={`/listings/${l.id}`} style={{ fontWeight: 700, color: '#1c1530', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap' }}>{l.title}</Link>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>{l.location}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600 }}>{l.host}</td>
                  <td style={{ padding: '13px 16px', color: '#1c1530', fontWeight: 700 }}>{l.price}</td>
                  <td style={{ padding: '13px 16px', color: '#9a94a8', fontWeight: 600 }}>{l.submitted}</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge label={st.label} bg={st.bg} color={st.color} /></td>
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                      {l.status === 'pending'  && <><ActionBtn action={approve} label="Approve" size="sm" /><ActionBtn action={reject} label="Reject" size="sm" variant="danger" /></>}
                      {l.status === 'approved' && <ActionBtn action={remove}  label="Remove"  size="sm" variant="danger" />}
                      {l.status === 'removed'  && <ActionBtn action={restore} label="Restore" size="sm" variant="ghost" />}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {listings.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9a94a8', fontWeight: 600, fontSize: 14 }}>No listings match this view.</div>
        )}
      </div>
    </>
  )
}
