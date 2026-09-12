import Link from 'next/link'
import { getMessageThreads, getThreadMeta, getThreadMessages } from '@/lib/data'
import { resolveReport, redactMessage, sendMessage, setTicketStatus } from '@/lib/actions'
import FilterPills from '@/components/ui/FilterPills'
import ActionBtn, { TriggerBtn } from '@/components/ui/ActionBtn'
import ReasonModal from '@/components/ui/ReasonModal'
import { avatarBg, initials } from '@/lib/utils'
import type { MessageThread, ThreadMessage } from '@/lib/types'
import styles from './page.module.css'

const FILTER_PILLS = [
  { label: 'All',      value: 'all',      href: '/messages' },
  { label: 'Reported', value: 'reported', href: '/messages?filter=reported' },
]

/* ── Icons (copied from the student/host messages UI) ─────────────── */
const IMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
  </svg>
)
const IFile = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
  </svg>
)
const IDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
)
const IBooking = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7h-9M14 17H5M17 3l3 4-3 4M7 21l-3-4 3-4" />
  </svg>
)
const ICalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)
const IPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6675" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
  </svg>
)
const IMsg = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const ICheck = () => (
  <svg width="15" height="11" viewBox="0 0 24 16" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 9l4 4L15 3" /><path d="M9 12l1 1L22 2" />
  </svg>
)
const IVerify = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
const IAttach = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.4 11.1-9.2 9.2a5 5 0 0 1-7-7l9.1-9.2a3.3 3.3 0 0 1 4.7 4.7l-9.1 9.1a1.7 1.7 0 0 1-2.4-2.4l8.5-8.4" />
  </svg>
)
const ISend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
  </svg>
)
const ISupport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
    <path d="m4.9 4.9 4.2 4.2M14.9 14.9l4.2 4.2M19.1 4.9l-4.2 4.2M9.1 14.9l-4.2 4.2" />
  </svg>
)

const ROLE_STYLE: Record<'student' | 'landlord', { color: string; bg: string }> = {
  student:  { color: '#1f8a5b', bg: '#eafaf2' },
  landlord: { color: '#6d28d9', bg: '#f3effe' },
}
function roleLabel(role: 'student' | 'landlord'): string {
  return role === 'landlord' ? 'Host' : 'Student'
}
function RoleChip({ role }: { role: 'student' | 'landlord' }) {
  const rs = ROLE_STYLE[role]
  return <span className={styles.roleChip} style={{ color: rs.color, background: rs.bg }}>{roleLabel(role)}</span>
}

/* ── Helpers ─────────────────────────────────────────────────────── */
const LISTING_THUMBS = [
  'repeating-linear-gradient(135deg,#c4b5fd 0 4px,#a78bfa 4px 8px)',
  'repeating-linear-gradient(135deg,#a7f3d0 0 4px,#6ee7b7 4px 8px)',
  'repeating-linear-gradient(135deg,#fde68a 0 4px,#fcd34d 4px 8px)',
  'repeating-linear-gradient(135deg,#fca5a5 0 4px,#f87171 4px 8px)',
]

function listingThumb(listingId: string | null): string {
  let h = 0
  const key = listingId ?? ''
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) & 0xfffffff
  return LISTING_THUMBS[h % LISTING_THUMBS.length]
}

function fmtMsgTime(ms: number | null): string {
  if (!ms) return ''
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// msg.metadata is JSON written by the student/host app, not admin-authored — one
// malformed value shouldn't crash the whole thread view a moderator needs to see.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMeta(raw: string | null): Record<string, any> {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/* ── Structured card sub-components ─────────────────────────────── */
function ListingRef({ title, city, rent, listingId }: { title: string | null; city: string | null; rent: number | null; listingId: string | null }) {
  return (
    <div className={styles.cardListingRef}>
      <div className={styles.cardListingThumb} style={{ background: listingThumb(listingId) }} />
      <span className={styles.cardListingName}>{title ? `${title} · ${city}` : listingId ? `Listing ${listingId}` : 'General inquiry'}</span>
      <span className={styles.cardListingPrice}>{rent != null ? `€${rent}/mo` : '—'}</span>
    </div>
  )
}

function BookingCard({ msg, thread }: { msg: ThreadMessage; thread: MessageThread }) {
  const meta = parseMeta(msg.metadata)
  return (
    <div className={styles.bookingCard}>
      <div className={styles.bookingCardInner}>
        <ListingRef title={thread.listingTitle} city={thread.listingCity} rent={thread.coldRent} listingId={thread.listingId} />
        <div className={styles.bookingCardHeader}>
          <div className={styles.bookingCardTitleRow}>
            <IBooking />
            <span className={styles.bookingCardLabel}>Booking offer</span>
            {meta.expiry && <span className={styles.bookingCardExpiry}>Expires in {meta.expiry}</span>}
          </div>
          <div className={styles.bookingCardPrice}>€{meta.price ?? thread.coldRent ?? '—'}<span className={styles.bookingCardPriceSuffix}>/mo</span></div>
          <div className={styles.bookingCardDetails}>
            {meta.move_in && `Move-in ${meta.move_in} · `}
            {meta.contract ?? ''}
            {meta.deposit && ` · deposit €${meta.deposit}`}
          </div>
        </div>
        <div className={styles.cardActions}>
          <button className={styles.declineBtn} disabled>Decline</button>
          <button className={styles.acceptBtn} disabled>Accept &amp; book</button>
        </div>
      </div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.createdAtMs)}</span>
    </div>
  )
}

function ViewingCard({ msg, thread }: { msg: ThreadMessage; thread: MessageThread }) {
  const meta = parseMeta(msg.metadata)
  return (
    <div className={styles.viewingCard}>
      <div className={styles.viewingCardInner}>
        <ListingRef title={thread.listingTitle} city={thread.listingCity} rent={thread.coldRent} listingId={thread.listingId} />
        <div className={styles.viewingCardHeader}>
          <div className={styles.viewingCardTitleRow}>
            <ICalendar />
            <span className={styles.viewingCardLabel}>Viewing appointment</span>
            {meta.expiry && <span className={styles.bookingCardExpiry}>{meta.expiry}</span>}
          </div>
          <div className={styles.viewingSlot}>
            <div>
              <div className={styles.viewingDate}>{meta.date ?? '—'}</div>
              <div className={styles.viewingTime}>{meta.slot ?? ''}</div>
            </div>
          </div>
          {meta.address && <div className={styles.viewingAddress}><IPin />{meta.address}</div>}
        </div>
        <div className={styles.cardActions}>
          <button className={styles.declineBtn} disabled>Decline</button>
          <button className={styles.acceptBtn} disabled>Confirm viewing</button>
        </div>
      </div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.createdAtMs)}</span>
    </div>
  )
}

// Rendered as its own flex item right after the bubble, for any message type
// (text, file, booking or viewing) that has an open report against it.
function ReportedTag({ msg }: { msg: ThreadMessage }) {
  const reportId = msg.reportId
  if (!reportId) return null
  const deleted = !!msg.deletedAt
  const isOut = msg.senderRole === 'landlord'
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', alignSelf: isOut ? 'flex-end' : 'flex-start', maxWidth: '62%', background: '#fdecec', border: '1px solid #f3c6c6', borderRadius: 10, padding: '7px 11px', fontSize: 12, fontWeight: 600, color: '#92201a' }}>
      <span>Reported: {msg.reportReason}</span>
      {!deleted && <ActionBtn action={redactMessage.bind(null, msg.id)} label="Redact" variant="danger" size="sm" />}
      <ReasonModal
        trigger={open => <TriggerBtn onClick={open} label="Resolve" size="sm" />}
        title="Resolve report"
        description="What action was taken on this message?"
        confirmLabel="Confirm resolve"
        placeholder="e.g. Warned the user, message redacted…"
        danger={false}
        onSubmit={note => resolveReport(reportId, note)}
      />
    </div>
  )
}

function MessageBubble({ msg, thread }: { msg: ThreadMessage; thread: MessageThread }) {
  const isOut = msg.senderRole !== 'student'

  if (msg.msgType === 'booking') return <BookingCard msg={msg} thread={thread} />
  if (msg.msgType === 'viewing') return <ViewingCard msg={msg} thread={thread} />

  if (msg.msgType === 'file') {
    const meta = parseMeta(msg.metadata)
    return (
      <div className={styles.fileCard} style={{ alignSelf: isOut ? 'flex-end' : 'flex-start' }}>
        <div className={styles.fileCardInner}>
          <div className={styles.fileIcon}><IFile /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.fileName}>{meta.name ?? msg.body}</div>
            <div className={styles.fileMeta}>{meta.size ?? ''}</div>
          </div>
          <IDownload />
        </div>
        <span className={styles.timeIn}>{fmtMsgTime(msg.createdAtMs)}</span>
      </div>
    )
  }

  const deleted = !!msg.deletedAt
  const textStyle = deleted ? { fontStyle: 'italic' as const, opacity: 0.7 } : undefined

  if (isOut) {
    return (
      <div className={styles.bubbleWrapOut}>
        <div className={styles.bubbleOut} style={textStyle}>{msg.body}</div>
        <div className={styles.timeOutRow}>
          <span className={styles.timeOut}>
            {msg.senderRole === 'admin' ? 'UniStay Support · ' : ''}
            {fmtMsgTime(msg.createdAtMs)}
            {msg.readAtMs ? ' · Read' : ''}
          </span>
          {msg.readAtMs && <ICheck />}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.bubbleWrapIn}>
      <div className={styles.bubbleIn} style={textStyle}>{msg.body}</div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.createdAtMs)}</span>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; thread?: string }>
}) {
  const { filter = 'all', thread: threadId } = await searchParams
  const threads = await getMessageThreads({ filter })
  const activeThread = threadId ? await getThreadMeta(threadId) : null
  const messages = activeThread ? await getThreadMessages(activeThread.inquiryId, activeThread.studentId, activeThread.landlordId) : []
  const qs = filter !== 'all' ? `filter=${filter}&` : ''

  return (
    <div className={styles.page} style={{ height: 'calc(100vh - 110px)', margin: '0 -38px', overflow: 'hidden' }}>
      <div className={styles.workspace} style={{ maxWidth: 'none', padding: '0 38px' }}>
        {/* ── Left: conversation list ── */}
        <div className={styles.threadPanel}>
          <div className={styles.threadPanelHeader}>
            <div className={styles.threadPanelTop}>
              <h1 className={styles.threadPanelTitle}>Messages</h1>
            </div>
            <FilterPills pills={FILTER_PILLS} current={filter} />
          </div>

          <div className={`${styles.threadList} us-scroll`}>
            {threads.length === 0 && (
              <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-soft)', fontSize: 13, fontWeight: 600 }}>
                No conversations match this view.
              </div>
            )}
            {threads.map(t => {
              const isActive = t.inquiryId === threadId
              return (
                <Link
                  key={t.inquiryId}
                  href={`/messages?${qs}thread=${t.inquiryId}`}
                  className={[styles.threadRow, isActive ? styles.threadRowActive : ''].join(' ')}
                >
                  <div className={styles.threadAvatarWrap}>
                    <div className={styles.threadAvatar} style={{ background: avatarBg(t.studentName) }}>{initials(t.studentName)}</div>
                  </div>
                  <div className={styles.threadMeta}>
                    <div className={styles.threadNameRow}>
                      <span className={styles.threadName}>{t.studentName} ↔ {t.landlordName}</span>
                      <RoleChip role="student" />
                      <RoleChip role="landlord" />
                      <span className={styles.threadTime} style={{ color: t.reported ? '#b91c1c' : '#b0aabf' }}>{t.lastAt}</span>
                    </div>
                    {t.listingTitle && (
                      <div className={styles.listingPill}>
                        <div className={styles.listingThumb} style={{ background: listingThumb(t.listingId) }} />
                        <span className={styles.listingPillText}>{t.listingTitle} · {t.listingCity}</span>
                      </div>
                    )}
                    <div className={styles.threadPreviewRow}>
                      <span className={styles.threadPreview} style={{ fontWeight: t.reported ? 700 : 600, color: t.reported ? '#1c1530' : '#9a94a8' }}>
                        {t.lastBody ?? 'No messages yet'}
                      </span>
                      {t.reported && <span className={styles.unreadBadge}>!</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Right: full conversation ── */}
        <div className={styles.chatPanel}>
          {!activeThread ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><IMsg /></div>
              <p className={styles.emptyTitle}>Conversation history</p>
              <p className={styles.emptyDesc}>Select a conversation to view the full message thread.</p>
            </div>
          ) : (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderAvatar}>
                  <div className={styles.chatAvatar} style={{ background: avatarBg(activeThread.studentName) }}>{initials(activeThread.studentName)}</div>
                </div>
                <div className={styles.chatHeaderMeta}>
                  <div className={styles.chatHeaderNameRow}>
                    <span className={styles.chatHeaderName}>{activeThread.studentName} ↔ {activeThread.landlordName}</span>
                    <RoleChip role="student" />
                    <span className={styles.hostChip}><IVerify /> HOST</span>
                  </div>
                  <div className={styles.chatHeaderStatus}>
                    {activeThread.type === 'support'
                      ? `Support ticket #${String(activeThread.ticketNo ?? 0).padStart(8, '0')}`
                      : activeThread.listingTitle ? `${activeThread.listingTitle} · ${activeThread.listingCity}` : 'Listing not in admin catalog'}
                  </div>
                </div>
                <button type="button" className={styles.moreBtn}><IMore /></button>
              </div>

              {activeThread.type === 'support' ? (
                <div className={styles.pinnedListing}>
                  <div className={styles.pinnedThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3effe' }}><ISupport /></div>
                  <div className={styles.pinnedMeta}>
                    <div className={styles.pinnedTitle}>{activeThread.subject ?? 'Support ticket'}</div>
                    <div className={styles.pinnedPrice}>
                      {`Ticket #${String(activeThread.ticketNo ?? 0).padStart(8, '0')}`}
                      {' · '}
                      <span style={{ color: activeThread.ticketStatus === 'resolved' ? '#1f8a5b' : '#b45309' }}>
                        {activeThread.ticketStatus === 'resolved' ? 'Resolved' : 'Open'}
                      </span>
                    </div>
                  </div>
                  <ActionBtn
                    action={setTicketStatus.bind(null, activeThread.inquiryId, activeThread.ticketStatus === 'resolved' ? 'open' : 'resolved')}
                    label={activeThread.ticketStatus === 'resolved' ? 'Reopen' : 'Mark resolved'}
                    variant={activeThread.ticketStatus === 'resolved' ? 'ghost' : 'primary'}
                  />
                </div>
              ) : activeThread.listingId && (
                <div className={styles.pinnedListing}>
                  <div className={styles.pinnedThumb} style={{ background: listingThumb(activeThread.listingId) }} />
                  <div className={styles.pinnedMeta}>
                    <div className={styles.pinnedTitle}>
                      {activeThread.listingTitle ? `${activeThread.listingTitle} · ${activeThread.listingCity}` : `Listing ${activeThread.listingId}`}
                    </div>
                    {activeThread.coldRent != null && (
                      <div className={styles.pinnedPrice}>{`€${activeThread.coldRent}/mo`}</div>
                    )}
                  </div>
                  {activeThread.listingTitle && (
                    <Link href={`/listings/${activeThread.listingId}`} className={styles.viewListingBtn}>View listing</Link>
                  )}
                </div>
              )}

              <div className={`${styles.messages} us-scroll`}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-soft)', fontSize: 13, fontWeight: 600 }}>
                    No messages in this conversation.
                  </div>
                )}
                {messages.map((msg, i) => {
                  const prev = messages[i - 1]
                  const showDate = !!msg.createdAtMs && (!prev || !prev.createdAtMs ||
                    new Date(msg.createdAtMs).toDateString() !== new Date(prev.createdAtMs).toDateString())
                  return (
                    <div key={msg.id} style={{ display: 'contents' }}>
                      {showDate && (
                        <div className={styles.dateDivider}>
                          <span className={styles.dateDividerLine} />
                          <span className={styles.dateDividerLabel}>
                            {new Date(msg.createdAtMs as number).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                          <span className={styles.dateDividerLine} />
                        </div>
                      )}
                      <MessageBubble msg={msg} thread={activeThread} />
                      <ReportedTag msg={msg} />
                    </div>
                  )
                })}
              </div>

              <form action={sendMessage.bind(null, activeThread.inquiryId)} className={styles.composer}>
                <div className={styles.composerRow}>
                  <button type="button" className={styles.attachBtn} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Attachments aren't supported from the admin console yet"><IAttach /></button>
                  <div className={styles.inputWrap}>
                    <input
                      name="body"
                      className={styles.composerInput}
                      placeholder={`Message as UniStay Support…`}
                      autoComplete="off"
                      required
                    />
                    <button type="submit" className={styles.sendBtn}><ISend /></button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
