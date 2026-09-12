import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getListing, getUser, getMessagesByListing } from '@/lib/data'
import { approveListing, rejectListing, archiveListing, restoreListing, deleteCasaListing } from '@/lib/actions'
import Avatar from '@/components/ui/Avatar'
import StatusBadge from '@/components/ui/StatusBadge'
import PhotoGallery from '@/components/ui/PhotoGallery'
import ListingRowActions from '../ListingRowActions'
import { listingStatus, messageStatus } from '@/lib/utils'

const LIVE_SITE_BASE = 'https://app.casasolutions.co/search'

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)
  if (!listing) notFound()

  const isCasa = listing.source === 'casa'

  const [host, listingMessages] = await Promise.all([
    isCasa ? Promise.resolve(null) : getUser(listing.hostId),
    getMessagesByListing(id),
  ])

  const st       = listingStatus(listing.status)
  const approve  = approveListing.bind(null, id)
  const reject   = rejectListing.bind(null, id)
  const archive  = archiveListing.bind(null, id)
  const restore  = restoreListing.bind(null, id, listing.status === 'archived')
  const removeCasa = deleteCasaListing.bind(null, id)

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
        <div style={{ padding: '22px 26px', display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: '-.02em' }}>{listing.title}</h2>
              <StatusBadge label={st.label} bg={st.bg} color={st.color} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#9a94a8', marginTop: 4 }}>
              {listing.location} · {listing.price} · hosted by{' '}
              {host ? <Link href={`/users/${host.id}`} style={{ color: '#6d28d9', fontWeight: 700, textDecoration: 'none' }}>{listing.host}</Link> : listing.host}
              {isCasa && <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', color: '#6d28d9', background: '#f3effe', padding: '2px 8px', borderRadius: 999 }}>CASA</span>}
            </div>
            {(listing.status === 'rejected' || listing.status === 'archived') && listing.rejectionReason && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#b91c1c', marginTop: 8, background: '#fdecec', borderRadius: 8, padding: '7px 11px' }}>
                Reason: {listing.rejectionReason}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flex: 'none', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <a
              href={`${LIVE_SITE_BASE}/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 999, border: '1.5px solid #e6e2ef', background: '#fff', fontSize: 13, fontWeight: 700, color: '#4a3d6b', textDecoration: 'none' }}
            >
              View live ↗
            </a>
            {isCasa
              ? (
                <form action={removeCasa}>
                  <button type="submit" className="us-btn-ghost" style={{ height: 38, padding: '0 16px', fontSize: 13 }}>Delete listing</button>
                </form>
              )
              : <ListingRowActions status={listing.status} approve={approve} reject={reject} archive={archive} restore={restore} size="md" />}
          </div>
        </div>

        {/* Photo gallery */}
        <div style={{ padding: '0 26px 22px' }}>
          <PhotoGallery photoKeys={listing.photoKeys ?? []} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        {[
          ['Type', listing.ptype ?? '—'],
          ['Bedrooms', listing.bedrooms ?? '—'],
          ['Bathrooms', listing.bathrooms ?? '—'],
          ['Size', listing.sizeSqm ? `${listing.sizeSqm} m²` : '—'],
        ].map(([label, val]) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 18, color: '#1c1530' }}>{val}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8', marginTop: 4 }}>{label}</div>
          </div>
        ))}
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

          {/* What the tenant pays */}
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 12 }}>WHAT THE TENANT PAYS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, fontWeight: 600, color: '#4a4654' }}>
              {[
                ['Cold rent', listing.coldRent != null ? `€${listing.coldRent}` : '—'],
                ['Utilities', listing.utilities != null ? `€${listing.utilities}` : '—'],
                ['Deposit', listing.deposit != null ? `€${listing.deposit}` : '—'],
              ].map(([label, val]) => (
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
        </div>

        {/* Right column — description, amenities, messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 12 }}>ABOUT THIS PLACE</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4a4654', margin: 0, whiteSpace: 'pre-wrap' }}>
              {listing.description || 'No description provided.'}
            </p>
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', padding: 20 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 12 }}>AMENITIES</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {listing.amenities.map(a => (
                  <div key={a} style={{ fontSize: 13.5, fontWeight: 600, color: '#4a4654' }}>{a}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1eef7', fontFamily: 'var(--font-bricolage)', fontWeight: 700, fontSize: 15 }}>Messages about this listing ({listingMessages.length})</div>
          {listingMessages.length === 0 && <div style={{ padding: 20, fontSize: 13, fontWeight: 600, color: '#b0aabf' }}>No messages about this listing.</div>}
          {listingMessages.map(m => {
            const ms = messageStatus(false, !!m.deletedAt)
            return (
              <Link key={m.id} href={`/messages?thread=${m.inquiryId}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f5f2fa', textDecoration: 'none' }}>
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
      </div>
    </>
  )
}
