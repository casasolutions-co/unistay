import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getListing, getUser, getMessagesByListing } from '@/lib/data'
import { approveListing, rejectListing, removeListing, restoreListing } from '@/lib/actions'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import ActionBtn from '@/components/ui/ActionBtn'
import { listingStatus, messageStatus, thumbBg } from '@/lib/utils'

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  const [host, listingMessages] = await Promise.all([
    getUser(listing.hostId),
    getMessagesByListing(listing.title),
  ])

  const st      = listingStatus(listing.status)
  const approve = approveListing.bind(null, id)
  const reject  = rejectListing.bind(null, id)
  const remove  = removeListing.bind(null, id)
  const restore = restoreListing.bind(null, id)
  const bg      = thumbBg(listing.thumb)

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
        <Link href="/listings" style={{ color: '#9a94a8', textDecoration: 'none' }}>‹ Listings</Link>
        <span style={{ color: '#d8d3e0' }}>/</span>
        <span style={{ color: '#1c1530' }}>{listing.title}</span>
      </div>

      {/* Hero card */}
      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ height: 150, background: bg }} />
        <div style={{ padding: '22px 26px', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-.02em' }}>{listing.title}</h2>
              <StatusBadge label={st.label} bg={st.bg} color={st.color} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#9a94a8', marginTop: 4 }}>
              {listing.location} · {listing.price} · hosted by{' '}
              {host ? <Link href={`/users/${host.id}`} style={{ color: '#6d28d9', fontWeight: 700, textDecoration: 'none' }}>{listing.host}</Link> : listing.host}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
            {listing.status === 'pending'  && <><ActionBtn action={approve} label="✓ Approve listing" size="md" /><ActionBtn action={reject} label="Reject" size="md" variant="danger" /></>}
            {listing.status === 'approved' && <ActionBtn action={remove}  label="Remove listing"  size="md" variant="danger" />}
            {listing.status === 'removed'  && <ActionBtn action={restore} label="Restore listing" size="md" variant="ghost" />}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 18, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Details */}
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 12 }}>ABOUT THIS LISTING</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, fontWeight: 600, color: '#4a4654' }}>
              {[['Location', listing.location], ['Price', listing.price], ['Submitted', listing.submitted]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9a94a8' }}>{label}</span><span>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Host */}
          {host && (
            <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 14 }}>HOST</div>
              <Link href={`/users/${host.id}`} style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
                <Avatar name={host.name} size={40} fontSize={14} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1530' }}>{host.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>View profile ›</div>
                </div>
              </Link>
            </div>
          )}

          {/* Photos mock */}
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 14 }}>PHOTOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ height: 70, borderRadius: 10, background: bg }} />
              <div style={{ height: 70, borderRadius: 10, background: bg, opacity: 0.7 }} />
              <div style={{ height: 70, borderRadius: 10, background: bg, opacity: 0.5 }} />
              <div style={{ height: 70, borderRadius: 10, border: '1.5px dashed #ddd0f6', display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 700, color: '#b0aabf' }}>+more</div>
            </div>
          </div>
        </div>

        {/* Right column — messages */}
        <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1eef7', fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 15 }}>Messages about this listing ({listingMessages.length})</div>
          {listingMessages.length === 0 && <div style={{ padding: 20, fontSize: 13, fontWeight: 600, color: '#b0aabf' }}>No messages about this listing.</div>}
          {listingMessages.map(m => {
            const ms = messageStatus(m.flagged)
            return (
              <Link key={m.id} href={`/messages?modal=${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f5f2fa', textDecoration: 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1530' }}>{m.userA} ↔ {m.userB}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9a94a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.preview}</div>
                </div>
                <StatusBadge label={ms.label} bg={ms.bg} color={ms.color} />
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
