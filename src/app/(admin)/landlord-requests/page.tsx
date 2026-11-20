import Link from 'next/link'
import { getLandlordApplications } from '@/lib/data'
import { approveLandlord, rejectLandlord } from '@/lib/actions'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterPills from '@/components/ui/FilterPills'
import LandlordRowActions from './LandlordRowActions'
import { landlordStatus } from '@/lib/utils'
import type { LandlordApplication } from '@/lib/types'

const RENTAL_LABEL: Record<string, string> = { owner: 'Private owner', sublet: 'Subletting (main tenant)', agency: 'Agency / property manager' }
const COUNT_LABEL: Record<string, string> = { '1': '1 place', '2-5': '2–5 places', '6+': '6+ places' }
// Mirrors DECLARATIONS in the student app's src/lib/landlordApplication.ts.
const DECLARATION_COUNT = 4

// Worth a closer look: subletting needs written permission (§ 540 BGB), and a
// private owner with 6+ places is usually an agency.
function flag(d: NonNullable<LandlordApplication['details']>): string | null {
  if (d.rentalType === 'sublet') return 'Ask for sublet permission'
  if (d.rentalType === 'owner' && d.listingCount === '6+') return 'Owner with 6+ places'
  return null
}

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
              {['APPLICANT', 'APPLICATION', 'APPLIED', 'STATUS', 'ACTIONS'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 4 ? 'right' : 'left', padding: i === 0 || i === 4 ? '13px 20px' : '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
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
                  <td style={{ padding: '13px 16px', verticalAlign: 'top' }}>
                    {a.details ? (() => {
                      const d = a.details
                      const f = flag(d)
                      const allDeclared = d.declarations.length >= DECLARATION_COUNT
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12.5, fontWeight: 600, color: '#4a4654' }}>
                          <div style={{ fontWeight: 700, color: '#1c1530' }}>{RENTAL_LABEL[d.rentalType] ?? d.rentalType} · {COUNT_LABEL[d.listingCount] ?? d.listingCount}</div>
                          {d.companyName && (
                            <div>
                              {d.companyName}
                              {d.companyWebsite && <> · <a href={d.companyWebsite} target="_blank" rel="noopener noreferrer" style={{ color: '#6d28d9' }}>{d.companyWebsite.replace(/^https?:\/\//, '')}</a></>}
                            </div>
                          )}
                          <div><a href={`tel:${d.phone.replace(/[^+\d]/g, '')}`} style={{ color: '#4a4654' }}>{d.phone}</a></div>
                          <div style={{ color: '#9a94a8' }}>
                            {allDeclared ? `All ${DECLARATION_COUNT} declarations confirmed` : `${d.declarations.length}/${DECLARATION_COUNT} declarations`} · Terms {d.termsVersion}
                            {a.applicationCount > 1 && ` · application #${a.applicationCount}`}
                          </div>
                          {f && <span style={{ alignSelf: 'flex-start', marginTop: 2, fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fff7ed', padding: '2px 9px', borderRadius: 999 }}>{f}</span>}
                        </div>
                      )
                    })() : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#b0aabf' }}>Applied before the form, no answers</span>
                    )}
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
                <td colSpan={5} style={{ padding: '32px 20px', textAlign: 'center', color: '#9a94a8', fontWeight: 600 }}>
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
