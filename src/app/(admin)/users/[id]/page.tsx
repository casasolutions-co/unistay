import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser, getDocsByUser, getListingsByHost, getMessagesByUser } from '@/lib/data'
import { verifyUser, kickUser, restoreUser, approveDoc, rejectDoc } from '@/lib/actions'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import ActionBtn from '@/components/ui/ActionBtn'
import { userStatus, listingStatus, docStatus, thumbBg } from '@/lib/utils'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(id)
  if (!user) notFound()

  const [docs, listings, userMessages] = await Promise.all([
    getDocsByUser(id),
    getListingsByHost(id),
    getMessagesByUser(user.name),
  ])
  const st = userStatus(user.status)
  const verify  = verifyUser.bind(null, id)
  const kick    = kickUser.bind(null, id)
  const restore = restoreUser.bind(null, id)

  const activity = [
    { label: 'Account created', time: user.joined, dot: '#6d28d9' },
    ...docs.slice(0, 1).map(d => ({ label: `Uploaded ${docs.length} document${docs.length > 1 ? 's' : ''}`, time: d.uploaded, dot: '#d97706' })),
    ...listings.map(l => ({ label: `Submitted listing "${l.title}"`, time: l.submitted, dot: '#9a94a8' })),
  ]

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
        <Link href="/users" style={{ color: '#9a94a8', textDecoration: 'none' }}>‹ Users</Link>
        <span style={{ color: '#d8d3e0' }}>/</span>
        <span style={{ color: '#1c1530' }}>{user.name}</span>
      </div>

      {/* Header card */}
      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: '22px 26px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Avatar name={user.name} size={56} fontSize={19} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-.02em' }}>{user.name}</h2>
            <StatusBadge label={st.label} bg={st.bg} color={st.color} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#9a94a8', marginTop: 4 }}>{user.email} · joined {user.joined}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
          {user.status === 'unverified' && <><ActionBtn action={verify} label="✓ Verify user" size="md" /><ActionBtn action={kick} label="Kick out" size="md" variant="danger" /></>}
          {user.status === 'verified'   && <ActionBtn action={kick}    label="Kick out"      size="md" variant="danger" />}
          {user.status === 'kicked'     && <ActionBtn action={restore} label="Restore access" size="md" variant="ghost" />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 18, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Contact */}
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 12 }}>CONTACT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, fontWeight: 600, color: '#4a4654' }}>
              {[['Email', user.email], ['Phone', user.phone], ['University', user.university]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: '#9a94a8' }}>{label}</span>
                  <span style={{ textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 14 }}>UPLOADED DOCUMENTS</div>
            {docs.length === 0 && <div style={{ fontSize: 13, fontWeight: 600, color: '#b0aabf' }}>No documents uploaded.</div>}
            {docs.map(doc => {
              const ds = docStatus(doc.status)
              const approve = approveDoc.bind(null, doc.id)
              const reject  = rejectDoc.bind(null, doc.id)
              return (
                <div key={doc.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 0', borderBottom: '1px solid #f5f2fa' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 9, background: '#f3effe', display: 'grid', placeItems: 'center', flex: 'none' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1530' }}>{doc.type}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#9a94a8' }}>{doc.uploaded}</div>
                    </div>
                    <StatusBadge label={ds.label} bg={ds.bg} color={ds.color} />
                  </div>
                  {doc.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, padding: '8px 0 4px' }}>
                      <ActionBtn action={approve} label="Approve" size="sm" />
                      <ActionBtn action={reject}  label="Reject"  size="sm" variant="danger" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Listings */}
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1eef7', fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 15 }}>Listings by this user ({listings.length})</div>
            {listings.length === 0 && <div style={{ padding: 20, fontSize: 13, fontWeight: 600, color: '#b0aabf' }}>No listings yet.</div>}
            {listings.map(l => {
              const ls = listingStatus(l.status)
              return (
                <Link key={l.id} href={`/listings/${l.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f5f2fa', textDecoration: 'none' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, background: thumbBg(l.thumb), flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1530' }}>{l.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>{l.location} · {l.price}</div>
                  </div>
                  <StatusBadge label={ls.label} bg={ls.bg} color={ls.color} />
                </Link>
              )
            })}
          </div>

          {/* Messages */}
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1eef7', fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 15 }}>Recent messages ({userMessages.length})</div>
            {userMessages.length === 0 && <div style={{ padding: 20, fontSize: 13, fontWeight: 600, color: '#b0aabf' }}>No messages yet.</div>}
            {userMessages.map(m => {
              const other = m.userA === user.name ? m.userB : m.userA
              return (
                <Link key={m.id} href={`/messages?modal=${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f5f2fa', textDecoration: 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1530' }}>{other}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9a94a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.preview}</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#b0aabf', flex: 'none' }}>{m.time}</span>
                </Link>
              )
            })}
          </div>

          {/* Activity */}
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Activity</div>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.dot, flex: 'none' }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#4a4654' }}>{a.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#b0aabf' }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
