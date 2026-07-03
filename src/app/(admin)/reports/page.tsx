import Link from 'next/link'
import { getReports } from '@/lib/data'
import { resolveReport, dismissReport, redactMessage } from '@/lib/actions'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterPills from '@/components/ui/FilterPills'
import ReportRowActions from './ReportRowActions'
import { reportStatus } from '@/lib/utils'

const FILTER_PILLS = [
  { label: 'All',        value: 'all',       href: '/reports' },
  { label: 'Open',       value: 'open',      href: '/reports?filter=open' },
  { label: 'Resolved',   value: 'resolved',  href: '/reports?filter=resolved' },
  { label: 'Dismissed',  value: 'dismissed', href: '/reports?filter=dismissed' },
]

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams
  const reports = await getReports({ filter })

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Reports</h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: '0 0 18px' }}>Trust &amp; safety queue — reports against users, listings, and messages all land here.</p>

      <FilterPills pills={FILTER_PILLS} current={filter} />

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fbfafd' }}>
              {['TARGET', 'REASON', 'REPORTED', 'STATUS', 'ACTIONS'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 4 ? 'right' : 'left', padding: i === 0 || i === 4 ? '13px 20px' : '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map(r => {
              const rs = reportStatus(r.status)
              const resolve = resolveReport.bind(null, r.id)
              const dismiss = dismissReport.bind(null, r.id)
              const redact  = r.targetType === 'message' ? redactMessage.bind(null, r.targetId) : undefined
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #f5f2fa' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <Link href={r.targetHref} style={{ fontWeight: 700, color: '#1c1530', textDecoration: 'none', display: 'block' }}>{r.summary}</Link>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8', textTransform: 'capitalize' }}>{r.targetType}</div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600, maxWidth: 320 }}>{r.reason}</td>
                  <td style={{ padding: '13px 16px', color: '#9a94a8', fontWeight: 600 }}>{r.createdAt}</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge label={rs.label} bg={rs.bg} color={rs.color} /></td>
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                      <ReportRowActions status={r.status} resolve={resolve} dismiss={dismiss} redact={redact} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {reports.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9a94a8', fontWeight: 600, fontSize: 14 }}>No reports match this view.</div>
        )}
      </div>
    </>
  )
}
