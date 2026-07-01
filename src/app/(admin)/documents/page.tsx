import Link from 'next/link'
import { getDocuments, getDocument } from '@/lib/data'
import { approveDoc, rejectDoc } from '@/lib/actions'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterPills from '@/components/ui/FilterPills'
import DocModal from '@/components/ui/DocModal'
import DocRowActions from './DocRowActions'
import { docStatus } from '@/lib/utils'

const FILTER_PILLS = [
  { label: 'All',      value: 'all',      href: '/documents' },
  { label: 'Pending',  value: 'pending',  href: '/documents?filter=pending' },
  { label: 'Approved', value: 'approved', href: '/documents?filter=approved' },
  { label: 'Rejected', value: 'rejected', href: '/documents?filter=rejected' },
]

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; modal?: string }>
}) {
  const { filter = 'all', modal } = await searchParams
  const documents = await getDocuments({ filter })

  const modalDoc = modal ? await getDocument(modal) : null

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Documents</h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: '0 0 18px' }}>ID and proof-of-enrolment files uploaded by users for verification.</p>

      <FilterPills pills={FILTER_PILLS} current={filter} />

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fbfafd' }}>
              {['DOCUMENT', 'USER', 'UPLOADED', 'STATUS', 'ACTIONS'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 4 ? 'right' : 'left', padding: i === 0 || i === 4 ? '13px 20px' : '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map(d => {
              const ds = docStatus(d.status)
              return (
                <tr key={d.id} style={{ borderBottom: '1px solid #f5f2fa' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <Link href={`/documents?${filter !== 'all' ? `filter=${filter}&` : ''}modal=${d.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: '#fdecec', display: 'grid', placeItems: 'center', flex: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9534f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      </span>
                      <span style={{ fontWeight: 700, color: '#1c1530' }}>{d.type}</span>
                    </Link>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600 }}>
                    <Link href={`/users/${d.userId}`} style={{ color: '#4a4654', textDecoration: 'none', fontWeight: 600 }}>{d.user}</Link>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#9a94a8', fontWeight: 600 }}>{d.uploaded}</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge label={ds.label} bg={ds.bg} color={ds.color} /></td>
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                      <Link href={`/documents?${filter !== 'all' ? `filter=${filter}&` : ''}modal=${d.id}`} style={{ height: 32, padding: '0 13px', borderRadius: 9, border: '1px solid #ece8f3', background: '#fff', color: '#4a4654', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Preview</Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {documents.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9a94a8', fontWeight: 600, fontSize: 14 }}>No documents match this view.</div>
        )}
      </div>

      {modalDoc && (
        <DocModal
          document={modalDoc}
          onApprove={approveDoc.bind(null, modalDoc.id)}
          onReject={rejectDoc.bind(null, modalDoc.id)}
        />
      )}
    </>
  )
}
