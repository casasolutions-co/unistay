'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppNav from '../components/AppNav';
import styles from './page.module.css';

/* ── Icons ──────────────────────────────────────────────────────── */
const IHome = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11.2 12 4l9 7.2" /><path d="M5.5 9.8V20h13V9.8" /><path d="M10 20v-5h4v5" />
  </svg>
);
const ISearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a94a8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const IPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
  </svg>
);
const ICheck = () => (
  <svg width="15" height="11" viewBox="0 0 24 16" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 9l4 4L15 3" /><path d="M9 12l1 1L22 2" />
  </svg>
);
const IFile = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
  </svg>
);
const IDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
const IBooking = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7h-9M14 17H5M17 3l3 4-3 4M7 21l-3-4 3-4" />
  </svg>
);
const ICalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b6675" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
  </svg>
);
const IAttach = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.4 11.1-9.2 9.2a5 5 0 0 1-7-7l9.1-9.2a3.3 3.3 0 0 1 4.7 4.7l-9.1 9.1a1.7 1.7 0 0 1-2.4-2.4l8.5-8.4" />
  </svg>
);
const ISend = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
  </svg>
);
const IVerify = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IMsg = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

/* ── Types ───────────────────────────────────────────────────────── */
interface InboxThread {
  inquiry_id: string;
  listing_id: string;
  listing_title: string;
  listing_city: string;
  cold_rent: number;
  landlord_id: string;
  student_id: string;
  other_id: string;
  other_name: string | null;
  other_role: string;
  last_body: string | null;
  last_type: string | null;
  last_sender_id: string | null;
  last_at: number | null;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  body: string;
  msg_type: string;
  metadata: string | null;
  created_at: number;
  read_at: number | null;
}

/* ── Helpers ─────────────────────────────────────────────────────── */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#7c3aed,#4a1d95)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#27ae73,#1f8a5b)',
  'linear-gradient(135deg,#475569,#1e293b)',
  'linear-gradient(135deg,#f5a623,#d97706)',
  'linear-gradient(135deg,#14b8a6,#0f766e)',
];

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
  landlord: { color: '#6d28d9', bg: '#f3effe' },
  student:  { color: '#1f8a5b', bg: '#eafaf2' },
  default:  { color: '#475569', bg: '#f1f5f9' },
};

function avatarGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xfffffff;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function initial(name: string | null, id: string): string {
  if (name) return name[0].toUpperCase();
  return id[0].toUpperCase();
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtMsgTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function roleLabel(role: string): string {
  if (role === 'landlord') return 'Host';
  if (role === 'student') return 'Student';
  return 'Team';
}

const QUICK_REPLIES = ['Is it still available?', 'Can I schedule a viewing?', 'Are utilities included?'];

const LISTING_THUMBS = [
  'repeating-linear-gradient(135deg,#c4b5fd 0 4px,#a78bfa 4px 8px)',
  'repeating-linear-gradient(135deg,#a7f3d0 0 4px,#6ee7b7 4px 8px)',
  'repeating-linear-gradient(135deg,#fde68a 0 4px,#fcd34d 4px 8px)',
  'repeating-linear-gradient(135deg,#fca5a5 0 4px,#f87171 4px 8px)',
];

function listingThumb(listingId: string): string {
  let h = 0;
  for (let i = 0; i < listingId.length; i++) h = (h * 31 + listingId.charCodeAt(i)) & 0xfffffff;
  return LISTING_THUMBS[h % LISTING_THUMBS.length];
}

/* ── Structured card sub-components ─────────────────────────────── */
function ListingRef({ title, city, rent, listingId }: { title: string; city: string; rent: number; listingId: string }) {
  return (
    <div className={styles.cardListingRef}>
      <div className={styles.cardListingThumb} style={{ background: listingThumb(listingId) }} />
      <span className={styles.cardListingName}>{title} · {city}</span>
      <span className={styles.cardListingPrice}>€{rent}/mo</span>
    </div>
  );
}

function BookingCard({ msg, thread }: { msg: ChatMessage; thread: InboxThread }) {
  const meta = msg.metadata ? JSON.parse(msg.metadata) : {};
  return (
    <div className={styles.bookingCard}>
      <div className={styles.bookingCardInner}>
        <ListingRef title={thread.listing_title} city={thread.listing_city} rent={thread.cold_rent} listingId={thread.listing_id} />
        <div className={styles.bookingCardHeader}>
          <div className={styles.bookingCardTitleRow}>
            <IBooking />
            <span className={styles.bookingCardLabel}>Booking offer</span>
            {meta.expiry && <span className={styles.bookingCardExpiry}>Expires in {meta.expiry}</span>}
          </div>
          <div className={styles.bookingCardPrice}>
            €{meta.price ?? thread.cold_rent}<span className={styles.bookingCardPriceSuffix}>/mo</span>
          </div>
          <div className={styles.bookingCardDetails}>
            {meta.move_in && `Move-in ${meta.move_in} · `}{meta.contract ?? ''}{meta.deposit && ` · deposit €${meta.deposit}`}
          </div>
        </div>
        <div className={styles.cardActions}>
          <button className={styles.declineBtn}>Decline</button>
          <button className={styles.acceptBtn}>Accept &amp; book</button>
        </div>
      </div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.created_at)}</span>
    </div>
  );
}

function ViewingCard({ msg, thread }: { msg: ChatMessage; thread: InboxThread }) {
  const meta = msg.metadata ? JSON.parse(msg.metadata) : {};
  return (
    <div className={styles.viewingCard}>
      <div className={styles.viewingCardInner}>
        <ListingRef title={thread.listing_title} city={thread.listing_city} rent={thread.cold_rent} listingId={thread.listing_id} />
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
          {meta.address && (
            <div className={styles.viewingAddress}><IPin />{meta.address}</div>
          )}
        </div>
        <div className={styles.cardActions}>
          <button className={styles.declineBtn}>Decline</button>
          <button className={styles.acceptBtn}>Confirm viewing</button>
        </div>
      </div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.created_at)}</span>
    </div>
  );
}

function MessageBubble({ msg, uid, thread }: { msg: ChatMessage; uid: string; thread: InboxThread }) {
  const isOut = msg.sender_id === uid;

  if (msg.msg_type === 'booking') return <BookingCard msg={msg} thread={thread} />;
  if (msg.msg_type === 'viewing') return <ViewingCard msg={msg} thread={thread} />;

  if (msg.msg_type === 'file') {
    const meta = msg.metadata ? JSON.parse(msg.metadata) : {};
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
        <span className={styles.timeIn}>{fmtMsgTime(msg.created_at)}</span>
      </div>
    );
  }

  if (isOut) {
    return (
      <div className={styles.bubbleWrapOut}>
        <div className={styles.bubbleOut}>{msg.body}</div>
        <div className={styles.timeOutRow}>
          <span className={styles.timeOut}>{fmtMsgTime(msg.created_at)}{msg.read_at ? ' · Read' : ''}</span>
          {msg.read_at && <ICheck />}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bubbleWrapIn}>
      <div className={styles.bubbleIn}>{msg.body}</div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.created_at)}</span>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function MessagesPage() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uid, setUid] = useState<string>('');

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const lastTsRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeThread = threads.find(t => t.inquiry_id === activeId) ?? null;

  /* ── Auth ── */
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthResolved(true);
      if (user) {
        const t = await user.getIdToken();
        setToken(t);
        setUid(user.uid);
      } else {
        setToken(null);
        setUid('');
        setLoadingInbox(false);
      }
    });
  }, []);

  /* ── Load inbox ── */
  const loadInbox = useCallback(async (t: string) => {
    setLoadingInbox(true);
    try {
      const res = await fetch('/api/chat', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return;
      const { threads: data } = await res.json();
      setThreads(data ?? []);
    } finally {
      setLoadingInbox(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadInbox(token);
  }, [token, loadInbox]);

  /* ── Load thread ── */
  const loadThread = useCallback(async (inquiryId: string, t: string) => {
    setLoadingThread(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/chat/${inquiryId}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return;
      const { messages: data, uid: serverUid } = await res.json();
      setMessages(data ?? []);
      if (serverUid) setUid(serverUid);
      const last = data?.[data.length - 1];
      lastTsRef.current = last?.created_at ?? Date.now();

      // Mark as read
      fetch(`/api/chat/${inquiryId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      }).then(() => {
        setThreads(prev =>
          prev.map(th => th.inquiry_id === inquiryId ? { ...th, unread_count: 0 } : th)
        );
      });
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const selectThread = useCallback((inquiryId: string) => {
    setActiveId(inquiryId);
    if (token) loadThread(inquiryId, token);
  }, [token, loadThread]);

  /* ── Polling — only while a thread is open ── */
  useEffect(() => {
    if (!activeId || !token) return;

    pollRef.current = setInterval(async () => {
      const freshToken = await authUser?.getIdToken();
      if (!freshToken) return;

      const res = await fetch(
        `/api/chat/${activeId}?since=${lastTsRef.current}`,
        { headers: { Authorization: `Bearer ${freshToken}` } }
      );
      if (!res.ok) return;
      const { messages: newMsgs } = await res.json();
      if (newMsgs?.length) {
        setMessages(prev => [...prev, ...newMsgs]);
        lastTsRef.current = newMsgs[newMsgs.length - 1].created_at;

        // Mark incoming as read immediately
        fetch(`/api/chat/${activeId}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${freshToken}` },
        });
      }
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeId, token, authUser]);

  /* ── Auto-scroll to bottom on new messages ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send ── */
  const send = useCallback(async () => {
    if (!input.trim() || !activeId || !token || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);

    // Optimistic insert
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      sender_id: uid,
      body,
      msg_type: 'text',
      metadata: null,
      created_at: Date.now(),
      read_at: null,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const freshToken = await authUser?.getIdToken();
      const res = await fetch(`/api/chat/${activeId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freshToken ?? token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const { id, created_at } = await res.json();
        // Replace optimistic with real ID
        setMessages(prev =>
          prev.map(m => m.id === optimisticId ? { ...m, id, created_at } : m)
        );
        lastTsRef.current = created_at;

        // Refresh inbox preview
        if (token) loadInbox(token);
      } else {
        // Roll back optimistic message
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
        setInput(body);
      }
    } finally {
      setSending(false);
    }
  }, [input, activeId, token, sending, uid, authUser, loadInbox]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  /* ── Render ── */
  return (
    <div className={styles.page}>
      <AppNav />

      {/* Workspace */}
      <div className={`${styles.workspace}${activeId ? ` ${styles.mobileShowChat}` : ''}`}>

        {/* ── Left: thread list ── */}
        <div className={styles.threadPanel}>
          <div className={styles.threadPanelHeader}>
            <div className={styles.threadPanelTop}>
              <h1 className={styles.threadPanelTitle}>Messages</h1>
              <button className={styles.newBtn}><IPlus /> New</button>
            </div>
            <div className={styles.searchBar}>
              <ISearch />
              <span className={styles.searchPlaceholder}>Search people or listings</span>
            </div>
          </div>

          <div className={`${styles.threadList} us-scroll`}>
            {loadingInbox && (
              <div style={{ padding: '32px 22px', textAlign: 'center', color: 'var(--text-soft)', fontSize: 13, fontWeight: 600 }}>
                Loading…
              </div>
            )}
            {!loadingInbox && threads.length === 0 && (
              <div style={{ padding: '40px 22px', textAlign: 'center', color: 'var(--text-soft)', fontSize: 13, fontWeight: 600 }}>
                {authResolved && !authUser
                  ? <><a href="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Sign in</a> to see your messages.</>
                  : 'No conversations yet.'}
              </div>
            )}
            {threads.map((t) => {
              const isActive = t.inquiry_id === activeId;
              const rs = ROLE_STYLE[t.other_role] ?? ROLE_STYLE.default;
              const displayName = t.other_name ?? (t.other_id ? t.other_id.slice(0, 8) : 'Host');
              const previewPrefix = t.last_sender_id === uid ? 'You: ' : '';
              const preview = t.last_body
                ? (t.last_type !== 'text' ? `📎 ${t.last_type}` : `${previewPrefix}${t.last_body}`)
                : 'No messages yet';

              return (
                <div
                  key={t.inquiry_id}
                  onClick={() => selectThread(t.inquiry_id)}
                  className={[
                    styles.threadRow,
                    isActive ? styles.threadRowActive : '',
                    !isActive && t.unread_count > 0 ? styles.threadRowUnread : '',
                  ].join(' ')}
                >
                  <div className={styles.threadAvatarWrap}>
                    <div className={styles.threadAvatar} style={{ background: avatarGradient(t.other_id ?? t.inquiry_id) }}>
                      {initial(t.other_name, t.other_id ?? t.inquiry_id)}
                    </div>
                  </div>
                  <div className={styles.threadMeta}>
                    <div className={styles.threadNameRow}>
                      <span className={styles.threadName}>{displayName}</span>
                      <span className={styles.roleChip} style={{ color: rs.color, background: rs.bg }}>
                        {roleLabel(t.other_role)}
                      </span>
                      <span className={styles.threadTime} style={{ color: t.unread_count > 0 ? '#6d28d9' : '#b0aabf' }}>
                        {t.last_at ? fmtTime(t.last_at) : ''}
                      </span>
                    </div>
                    {t.listing_title && (
                      <div className={styles.listingPill}>
                        <div className={styles.listingThumb} style={{ background: listingThumb(t.listing_id) }} />
                        <span className={styles.listingPillText}>{t.listing_title} · {t.listing_city}</span>
                      </div>
                    )}
                    <div className={styles.threadPreviewRow}>
                      <span
                        className={styles.threadPreview}
                        style={{ fontWeight: t.unread_count > 0 ? 700 : 600, color: t.unread_count > 0 ? '#1c1530' : '#9a94a8' }}
                      >{preview}</span>
                      {t.unread_count > 0 && (
                        <span className={styles.unreadBadge}>{t.unread_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: active thread ── */}
        <div className={styles.chatPanel}>
          {!activeThread ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><IMsg /></div>
              <p className={styles.emptyTitle}>Your messages</p>
              <p className={styles.emptyDesc}>Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              {/* header */}
              <div className={styles.chatHeader}>
                <button className={styles.mobileBackBtn} onClick={() => setActiveId(null)} aria-label="Back">
                  <IBack />
                </button>
                <div className={styles.chatHeaderAvatar}>
                  <div className={styles.chatAvatar} style={{ background: avatarGradient(activeThread.other_id ?? activeThread.inquiry_id) }}>
                    {initial(activeThread.other_name, activeThread.other_id ?? activeThread.inquiry_id)}
                  </div>
                </div>
                <div className={styles.chatHeaderMeta}>
                  <div className={styles.chatHeaderNameRow}>
                    <span className={styles.chatHeaderName}>{activeThread.other_name ?? (activeThread.other_id ? activeThread.other_id.slice(0, 8) : 'Host')}</span>
                    {activeThread.other_role === 'landlord' && (
                      <span className={styles.hostChip}><IVerify /> HOST</span>
                    )}
                  </div>
                  <div className={styles.chatHeaderStatus}>
                    {activeThread.listing_title} · {activeThread.listing_city}
                  </div>
                </div>
                <button className={styles.moreBtn}><IMore /></button>
              </div>

              {/* pinned listing */}
              <div className={styles.pinnedListing}>
                <div className={styles.pinnedThumb} style={{ background: listingThumb(activeThread.listing_id) }} />
                <div className={styles.pinnedMeta}>
                  <div className={styles.pinnedTitle}>{activeThread.listing_title} · {activeThread.listing_city}</div>
                  <div className={styles.pinnedPrice}>€{activeThread.cold_rent}/mo · about this listing</div>
                </div>
                <button className={styles.viewListingBtn} onClick={() => window.open(`/search/${activeThread.listing_id}`, '_blank')}>
                  View listing
                </button>
              </div>

              {/* messages */}
              <div className={`${styles.messages} us-scroll`}>
                {loadingThread && (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-soft)', fontSize: 13, fontWeight: 600 }}>
                    Loading messages…
                  </div>
                )}
                {!loadingThread && messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-soft)', fontSize: 13, fontWeight: 600 }}>
                    No messages yet. Say hello!
                  </div>
                )}
                {messages.map((msg, i) => {
                  const prev = messages[i - 1];
                  const showDate = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                  return (
                    <div key={msg.id} style={{ display: 'contents' }}>
                      {showDate && (
                        <div className={styles.dateDivider}>
                          <span className={styles.dateDividerLine} />
                          <span className={styles.dateDividerLabel}>
                            {new Date(msg.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                          <span className={styles.dateDividerLine} />
                        </div>
                      )}
                      <MessageBubble msg={msg} uid={uid} thread={activeThread} />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* composer */}
              <div className={styles.composer}>
                <div className={styles.quickReplies}>
                  {QUICK_REPLIES.map((q) => (
                    <button key={q} className={styles.quickReplyBtn} onClick={() => setInput(q)}>{q}</button>
                  ))}
                </div>
                <div className={styles.composerRow}>
                  <button className={styles.attachBtn}><IAttach /></button>
                  <div className={styles.inputWrap}>
                    <input
                      className={styles.composerInput}
                      placeholder={`Message ${activeThread.other_name?.split(' ')[0] ?? 'them'}…`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                    />
                    <button className={styles.sendBtn} onClick={send} disabled={sending || !input.trim()}>
                      <ISend />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className={styles.mobileNav}>
        {[
          { label: 'Explore', href: '/', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg> },
          { label: 'Saved', href: '/saved', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg> },
          { label: 'Messages', href: '/messages', active: true, icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
          { label: 'Profile', href: '/settings', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg> },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`${styles.mobileNavItem}${item.active ? ` ${styles.mobileNavItemActive}` : ''}`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
