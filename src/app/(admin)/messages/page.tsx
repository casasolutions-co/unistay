import Link from 'next/link'
import { getMessages, getMessage } from '@/lib/data'
import { resolveMessage } from '@/lib/actions'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterPills from '@/components/ui/FilterPills'
import MessageModal from '@/components/ui/MessageModal'
import { messageStatus } from '@/lib/utils'

const FILTER_PILLS = [
  { label: 'All',     value: 'all',     href: '/messages' },
  { label: 'Flagged', value: 'flagged', href: '/messages?filter=flagged' },
]

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; modal?: string }>
}) {
  const { filter = 'all', modal } = await searchParams
  const messages = await getMessages({ filter })

  const modalMessage = modal ? await getMessage(modal) : null

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Messages</h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: '0 0 18px' }}>Every conversation across UniStay, with anything flagged for review.</p>

      <FilterPills pills={FILTER_PILLS} current={filter} />

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fbfafd' }}>
              {['CONVERSATION', 'LISTING', 'LAST MESSAGE', 'STATUS', 'ACTIONS'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 4 ? 'right' : 'left', padding: i === 0 || i === 4 ? '13px 20px' : '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {messages.map(m => {
              const ms = messageStatus(m.flagged)
              return (
                <tr key={m.id} style={{ borderBottom: '1px solid #f5f2fa' }}>
                  <td style={{ padding: '13px 20px' }}>
                    <Link href={`/messages?${filter !== 'all' ? `filter=${filter}&` : ''}modal=${m.id}`} style={{ fontWeight: 700, color: '#1c1530', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap' }}>{m.userA} ↔ {m.userB}</Link>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>{m.time}</div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600 }}>{m.listing ?? '—'}</td>
                  <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.preview}</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge label={ms.label} bg={ms.bg} color={ms.color} /></td>
                  <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                      <Link href={`/messages?${filter !== 'all' ? `filter=${filter}&` : ''}modal=${m.id}`} style={{ height: 32, padding: '0 13px', borderRadius: 9, border: '1px solid #ece8f3', background: '#fff', color: '#4a4654', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>View</Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {messages.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9a94a8', fontWeight: 600, fontSize: 14 }}>No conversations match this view.</div>
        )}
      </div>

      {modalMessage && (
        <MessageModal
          message={modalMessage}
          onResolve={resolveMessage.bind(null, modalMessage.id)}
        />
      )}
    </>
  )
}
