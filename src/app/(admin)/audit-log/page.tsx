import { getAuditLog } from '@/lib/data'

export default async function AuditLogPage() {
  const entries = await getAuditLog()

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Audit log</h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: '0 0 18px' }}>Read-only feed of every admin action — who did what, and why.</p>

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fbfafd' }}>
              {['ADMIN', 'ACTION', 'TARGET', 'NOTE', 'WHEN'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f5f2fa' }}>
                <td style={{ padding: '13px 16px', color: '#1c1530', fontWeight: 700 }}>{e.adminEmail}</td>
                <td style={{ padding: '13px 16px', color: '#6d28d9', fontWeight: 700, fontFamily: 'monospace', fontSize: 12.5 }}>{e.action}</td>
                <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600 }}>{e.targetType} · {e.targetId}</td>
                <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600, maxWidth: 320 }}>{e.note ?? '—'}</td>
                <td style={{ padding: '13px 16px', color: '#9a94a8', fontWeight: 600 }}>{e.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9a94a8', fontWeight: 600, fontSize: 14 }}>No admin actions logged yet.</div>
        )}
      </div>
    </>
  )
}
