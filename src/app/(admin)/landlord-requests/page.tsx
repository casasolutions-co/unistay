import Link from 'next/link'
import { getLandlordApplications } from '@/lib/data'
import { approveLandlord, rejectLandlord } from '@/lib/actions'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterPills from '@/components/ui/FilterPills'
import LandlordRowActions from './LandlordRowActions'
import { landlordStatus } from '@/lib/utils'

const FILTER_PILLS = [
  { label: 'All',      value: 'all',      href: '/landlord-requests' },
  { label: 'Pending',  value: 'pending',  href: '/landlord-requests?filter=pending' },
  { label: 'Approved', value: 'approved', href: '/landlord-requests?filter=approved' },
  { label: 'Rejected', value: 'rejected', href: '/landlord-requests?filter=rejected' },
]

export default async function LandlordRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const applications = await getLandlordApplications({ filter })

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Landlord requests</h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: '0 0 18px' }}>
        Users applying to publish listings. Approval is required before their submissions leave draft.
      </p>

      <FilterPills pills={FILTER_PILLS} current={filter} />

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fbfafd' }}>
              {['APPLICANT', 'APPLIED', 'STATUS', 'ACTIONS'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 3 ? 'right' : 'left', padding: i === 0 || i === 3 ? '13px 20px' : '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map(a => {
              const st = landlordStatus(a.status)
              const approve = approveLandlord.bind(null, a.id)
              const reject = rejectLandlord.bind(null, a.id)
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid #f5f2fa' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <Link href={`/users/${a.id}`} style={{ fontWeight: 700, color: '#1c1530', textDecoration: 'none', display: 'block' }}>{a.name}</Link>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>{a.email}</div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#9a94a8', fontWeight: 600 }}>{a.applied}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <StatusBadge label={st.label} bg={st.bg} color={st.color} />
                    {a.status === 'rejected' && a.note && (
                      <div style={{ fontSize: 11.5, color: '#9a94a8', marginTop: 4, maxWidth: 260 }}>{a.note}</div>
                    )}
                  </td>
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    {a.status === 'pending' && <LandlordRowActions approve={approve} reject={reject} />}
                    {a.status === 'rejected' && <LandlordRowActions approve={approve} reject={reject} />}
                  </td>
                </tr>
              )
            })}
            {applications.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: '#9a94a8', fontWeight: 600 }}>
                  No landlord requests here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
