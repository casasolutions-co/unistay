"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AppNav from "../components/AppNav";
import MenuSheet, { MenuItem } from "./MenuSheet";
import ReportUserModal from "./ReportUserModal";
import ProposeTimesSheet, { ProposedSlot } from "./ProposeTimesSheet";
import styles from "./page.module.css";

/* ── Icons ──────────────────────────────────────────────────────── */
const ISearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9a94a8"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const IMore = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);
const ICheck = () => (
  <svg
    width="15"
    height="11"
    viewBox="0 0 24 16"
    fill="none"
    stroke="#6d28d9"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 9l4 4L15 3" />
    <path d="M9 12l1 1L22 2" />
  </svg>
);
const IFile = () => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);
const IDownload = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6d28d9"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
const IBooking = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6d28d9"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 7h-9M14 17H5M17 3l3 4-3 4M7 21l-3-4 3-4" />
  </svg>
);
const ICalendar = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6d28d9"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IPin = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6b6675"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);
const IAttach = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.4 11.1-9.2 9.2a5 5 0 0 1-7-7l9.1-9.2a3.3 3.3 0 0 1 4.7 4.7l-9.1 9.1a1.7 1.7 0 0 1-2.4-2.4l8.5-8.4" />
  </svg>
);
const ISend = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
  </svg>
);
const IVerify = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IMsg = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const IBack = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const MenuIcon = ({ d }: { d: string }) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const MENU_ICON_PATHS = {
  listing: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.3-4.3",
  mute: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  report:
    "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  block: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM4.9 4.9l14.2 14.2",
  deleteConvo:
    "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z",
  photo:
    "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 16l-5-5L5 21",
  document: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
};

/* ── Types ───────────────────────────────────────────────────────── */
interface InboxThread {
  inquiry_id: string;
  listing_id: string | null;
  listing_title: string | null;
  listing_city: string | null;
  cold_rent: number | null;
  landlord_id: string | null;
  student_id: string;
  type: string;
  subject: string | null;
  ticket_no: number | null;
  other_id: string | null;
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

// Appends only messages whose id isn't already present — guards against a
// send/response handler and the background poll both landing the same
// message (the poll's `since` window can overlap an in-flight send).
function appendUnique(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const existingIds = new Set(prev.map((m) => m.id));
  const fresh = incoming.filter((m) => !existingIds.has(m.id));
  return fresh.length ? [...prev, ...fresh] : prev;
}

/* ── Helpers ─────────────────────────────────────────────────────── */
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#7c3aed,#4a1d95)",
  "linear-gradient(135deg,#8b5cf6,#6d28d9)",
  "linear-gradient(135deg,#27ae73,#1f8a5b)",
  "linear-gradient(135deg,#475569,#1e293b)",
  "linear-gradient(135deg,#f5a623,#d97706)",
  "linear-gradient(135deg,#14b8a6,#0f766e)",
];

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
  landlord: { color: "#6d28d9", bg: "#f3effe" },
  student: { color: "#1f8a5b", bg: "#eafaf2" },
  support: { color: "#b45309", bg: "#fff7ed" },
  default: { color: "#475569", bg: "#f1f5f9" },
};

function avatarGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++)
    h = (h * 31 + id.charCodeAt(i)) & 0xfffffff;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function initial(name: string | null, id: string): string {
  if (name) return name[0].toUpperCase();
  return id[0].toUpperCase();
}

function ticketRef(ticketNo: number | null, inquiryId: string): string {
  return ticketNo != null ? String(ticketNo) : inquiryId.slice(0, 8).toUpperCase();
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtMsgTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role: string): string {
  if (role === "landlord") return "Host";
  if (role === "student") return "Student";
  if (role === "support") return "Support";
  return "Team";
}

const QUICK_REPLIES = [
  "Is it still available?",
  "Can I schedule a viewing?",
  "Are utilities included?",
];

const LISTING_THUMBS = [
  "repeating-linear-gradient(135deg,#c4b5fd 0 4px,#a78bfa 4px 8px)",
  "repeating-linear-gradient(135deg,#a7f3d0 0 4px,#6ee7b7 4px 8px)",
  "repeating-linear-gradient(135deg,#fde68a 0 4px,#fcd34d 4px 8px)",
  "repeating-linear-gradient(135deg,#fca5a5 0 4px,#f87171 4px 8px)",
];

function listingThumb(listingId: string): string {
  let h = 0;
  for (let i = 0; i < listingId.length; i++)
    h = (h * 31 + listingId.charCodeAt(i)) & 0xfffffff;
  return LISTING_THUMBS[h % LISTING_THUMBS.length];
}

/* ── Structured card sub-components ─────────────────────────────── */
function ListingRef({
  title,
  city,
  rent,
  listingId,
}: {
  title: string | null;
  city: string | null;
  rent: number | null;
  listingId: string | null;
}) {
  return (
    <div className={styles.cardListingRef}>
      <div
        className={styles.cardListingThumb}
        style={{ background: listingThumb(listingId ?? "") }}
      />
      <span className={styles.cardListingName}>
        {title} · {city}
      </span>
      <span className={styles.cardListingPrice}>€{rent}/mo</span>
    </div>
  );
}

function CardActions({
  status,
  canRespond,
  onAccept,
  onDecline,
  acceptLabel,
}: {
  status?: string;
  canRespond: boolean;
  onAccept: () => void;
  onDecline: () => void;
  acceptLabel: string;
}) {
  if (status === "accepted") {
    return <div className={styles.cardActions}><span style={{ fontSize: 12.5, fontWeight: 700, color: "#1f8a5b" }}>Accepted ✓</span></div>;
  }
  if (status === "declined") {
    return <div className={styles.cardActions}><span style={{ fontSize: 12.5, fontWeight: 700, color: "#dc2626" }}>Declined</span></div>;
  }
  if (!canRespond) {
    return <div className={styles.cardActions}><span style={{ fontSize: 12.5, fontWeight: 700, color: "#9a94a8" }}>Awaiting response</span></div>;
  }
  return (
    <div className={styles.cardActions}>
      <button className={styles.declineBtn} onClick={onDecline}>Decline</button>
      <button className={styles.acceptBtn} onClick={onAccept}>{acceptLabel}</button>
    </div>
  );
}

function BookingCard({
  msg,
  thread,
  uid,
  onRespond,
}: {
  msg: ChatMessage;
  thread: InboxThread;
  uid: string;
  onRespond: (messageId: string, status: "accepted" | "declined") => void;
}) {
  const meta = msg.metadata ? JSON.parse(msg.metadata) : {};
  return (
    <div className={styles.bookingCard}>
      <div className={styles.bookingCardInner}>
        <ListingRef
          title={thread.listing_title}
          city={thread.listing_city}
          rent={thread.cold_rent}
          listingId={thread.listing_id}
        />
        <div className={styles.bookingCardHeader}>
          <div className={styles.bookingCardTitleRow}>
            <IBooking />
            <span className={styles.bookingCardLabel}>Booking offer</span>
            {meta.expiry && (
              <span className={styles.bookingCardExpiry}>
                Expires in {meta.expiry}
              </span>
            )}
          </div>
          <div className={styles.bookingCardPrice}>
            €{meta.price ?? thread.cold_rent}
            <span className={styles.bookingCardPriceSuffix}>/mo</span>
          </div>
          <div className={styles.bookingCardDetails}>
            {meta.move_in && `Move-in ${meta.move_in} · `}
            {meta.contract ?? ""}
            {meta.deposit && ` · deposit €${meta.deposit}`}
          </div>
        </div>
        <CardActions
          status={meta.status}
          canRespond={msg.sender_id !== uid}
          onAccept={() => onRespond(msg.id, "accepted")}
          onDecline={() => onRespond(msg.id, "declined")}
          acceptLabel="Accept & book"
        />
      </div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.created_at)}</span>
    </div>
  );
}

function ViewingCard({
  msg,
  thread,
  uid,
  onRespond,
}: {
  msg: ChatMessage;
  thread: InboxThread;
  uid: string;
  onRespond: (messageId: string, status: "accepted" | "declined") => void;
}) {
  const meta = msg.metadata ? JSON.parse(msg.metadata) : {};
  return (
    <div className={styles.viewingCard}>
      <div className={styles.viewingCardInner}>
        <ListingRef
          title={thread.listing_title}
          city={thread.listing_city}
          rent={thread.cold_rent}
          listingId={thread.listing_id}
        />
        <div className={styles.viewingCardHeader}>
          <div className={styles.viewingCardTitleRow}>
            <ICalendar />
            <span className={styles.viewingCardLabel}>Viewing appointment</span>
            {meta.expiry && (
              <span className={styles.bookingCardExpiry}>{meta.expiry}</span>
            )}
          </div>
          <div className={styles.viewingSlot}>
            <div>
              <div className={styles.viewingDate}>{meta.date ?? "—"}</div>
              <div className={styles.viewingTime}>{meta.slot ?? ""}</div>
            </div>
          </div>
          {meta.address && (
            <div className={styles.viewingAddress}>
              <IPin />
              {meta.address}
            </div>
          )}
        </div>
        <CardActions
          status={meta.status}
          canRespond={msg.sender_id !== uid}
          onAccept={() => onRespond(msg.id, "accepted")}
          onDecline={() => onRespond(msg.id, "declined")}
          acceptLabel="Confirm viewing"
        />
      </div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.created_at)}</span>
    </div>
  );
}

function ViewingTimesCard({
  msg,
  uid,
  onSelect,
}: {
  msg: ChatMessage;
  uid: string;
  onSelect: (messageId: string, index: number) => void;
}) {
  const meta = msg.metadata ? JSON.parse(msg.metadata) : {};
  const slots: { date: string; time: string }[] = meta.slots ?? [];
  const canRespond = msg.sender_id !== uid;
  const isSelected = meta.status === "selected";

  return (
    <div className={styles.viewingTimesCard}>
      <div className={styles.viewingTimesInner}>
        <div className={styles.viewingTimesHeader}>
          <div className={styles.viewingTimesTitleRow}>
            <ICalendar />
            <span className={styles.viewingTimesLabel}>
              Proposed viewing times
            </span>
          </div>
          <div className={styles.viewingTimesSub}>
            {isSelected
              ? "Viewing time confirmed"
              : "Pick a time that works for you"}
          </div>
        </div>
        <div className={styles.viewingTimesList}>
          {slots.map((slot, i) => {
            const chosen = isSelected && meta.selectedIndex === i;
            return (
              <button
                key={i}
                type="button"
                className={styles.viewingTimesSlotBtn}
                onClick={() => canRespond && !isSelected && onSelect(msg.id, i)}
                disabled={!canRespond || isSelected}
              >
                <span>
                  {slot.date} · {slot.time}
                </span>
                <span
                  style={{
                    color: chosen ? "#1f8a5b" : "#6d28d9",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {chosen
                    ? "✓ Confirmed"
                    : isSelected
                      ? ""
                      : canRespond
                        ? "Select"
                        : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <span className={styles.timeIn}>{fmtMsgTime(msg.created_at)}</span>
    </div>
  );
}

function MessageBubble({
  msg,
  uid,
  thread,
  onRespond,
  onSelectViewingSlot,
}: {
  msg: ChatMessage;
  uid: string;
  thread: InboxThread;
  onRespond: (messageId: string, status: "accepted" | "declined") => void;
  onSelectViewingSlot: (messageId: string, index: number) => void;
}) {
  const isOut = msg.sender_id === uid;

  if (msg.msg_type === "booking")
    return <BookingCard msg={msg} thread={thread} uid={uid} onRespond={onRespond} />;
  if (msg.msg_type === "viewing")
    return <ViewingCard msg={msg} thread={thread} uid={uid} onRespond={onRespond} />;
  if (msg.msg_type === "viewing_times")
    return <ViewingTimesCard msg={msg} uid={uid} onSelect={onSelectViewingSlot} />;

  if (msg.msg_type === "file") {
    const meta = msg.metadata ? JSON.parse(msg.metadata) : {};
    return (
      <div
        className={styles.fileCard}
        style={{ alignSelf: isOut ? "flex-end" : "flex-start" }}
      >
        <a
          className={styles.fileCardInner}
          href={meta.url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          download={meta.name}
          style={{ textDecoration: "none", cursor: meta.url ? "pointer" : "default" }}
        >
          <div className={styles.fileIcon}>
            <IFile />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles.fileName}>{meta.name ?? msg.body}</div>
            <div className={styles.fileMeta}>{meta.size ?? ""}</div>
          </div>
          <IDownload />
        </a>
        <span className={styles.timeIn}>{fmtMsgTime(msg.created_at)}</span>
      </div>
    );
  }

  if (isOut) {
    return (
      <div className={styles.bubbleWrapOut}>
        <div className={styles.bubbleOut}>{msg.body}</div>
        <div className={styles.timeOutRow}>
          <span className={styles.timeOut}>
            {fmtMsgTime(msg.created_at)}
            {msg.read_at ? " · Read" : ""}
          </span>
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
  const [uid, setUid] = useState<string>("");

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const [myPrefs, setMyPrefs] = useState<{
    mutedThreads?: string[];
    blockedUsers?: string[];
    hiddenThreads?: Record<string, number>;
  }>({});
  const [reportedThreadIds, setReportedThreadIds] = useState<Set<string>>(
    new Set(),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [proposeTimesOpen, setProposeTimesOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const lastTsRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeThread = threads.find((t) => t.inquiry_id === activeId) ?? null;
  const isBlocked = !!(
    activeThread?.other_id &&
    myPrefs.blockedUsers?.includes(activeThread.other_id)
  );

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
        setUid("");
        setLoadingInbox(false);
      }
    });
  }, []);

  /* ── Load inbox ── */
  const loadInbox = useCallback(async (t: string) => {
    setLoadingInbox(true);
    try {
      const res = await fetch("/api/chat", {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the fetch once a token is available; loadInbox sets loading synchronously before its own await
    if (token) loadInbox(token);
  }, [token, loadInbox]);

  /* ── Load my preferences (mute/block/hidden threads) ── */
  useEffect(() => {
    if (!token) return;
    fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.preferences) setMyPrefs(data.user.preferences);
      })
      .catch(() => {});
  }, [token]);

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
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      }).then(() => {
        setThreads((prev) =>
          prev.map((th) =>
            th.inquiry_id === inquiryId ? { ...th, unread_count: 0 } : th,
          ),
        );
      });
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const selectThread = useCallback(
    (inquiryId: string) => {
      setActiveId(inquiryId);
      setOverflowMenuOpen(false);
      setSearchOpen(false);
      setSearchQuery("");
      setAttachMenuOpen(false);
      setAttachError(null);
      setProposeTimesOpen(false);
      if (token) loadThread(inquiryId, token);
    },
    [token, loadThread],
  );

  /* ── Polling — only while a thread is open ── */
  useEffect(() => {
    if (!activeId || !token) return;

    pollRef.current = setInterval(async () => {
      const freshToken = await authUser?.getIdToken();
      if (!freshToken) return;

      const res = await fetch(
        `/api/chat/${activeId}?since=${lastTsRef.current}`,
        { headers: { Authorization: `Bearer ${freshToken}` } },
      );
      if (!res.ok) return;
      const { messages: newMsgs } = await res.json();
      if (newMsgs?.length) {
        setMessages((prev) => appendUnique(prev, newMsgs));
        lastTsRef.current = newMsgs[newMsgs.length - 1].created_at;

        // Mark incoming as read immediately
        fetch(`/api/chat/${activeId}/read`, {
          method: "POST",
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send ── */
  const send = useCallback(async () => {
    if (!input.trim() || !activeId || !token || sending) return;
    const body = input.trim();
    setInput("");
    setSending(true);

    // Optimistic insert
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      sender_id: uid,
      body,
      msg_type: "text",
      metadata: null,
      created_at: Date.now(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const freshToken = await authUser?.getIdToken();
      const res = await fetch(`/api/chat/${activeId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${freshToken ?? token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const { id, created_at } = await res.json();
        // Replace optimistic with real ID — unless the poll already landed
        // this exact message first, in which case just drop the placeholder.
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
          if (withoutOptimistic.some((m) => m.id === id)) return withoutOptimistic;
          return [...withoutOptimistic, { ...optimisticMsg, id, created_at }];
        });
        lastTsRef.current = created_at;

        // Refresh inbox preview
        if (token) loadInbox(token);
      } else {
        // Roll back optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setInput(body);
      }
    } finally {
      setSending(false);
    }
  }, [input, activeId, token, sending, uid, authUser, loadInbox]);

  /* ── Upload a photo/document attachment ── */
  const uploadAttachment = useCallback(
    async (file: File, kind: "photo" | "document") => {
      if (!activeId || !authUser) return;
      setUploadingAttachment(true);
      setAttachError(null);
      try {
        const freshToken = await authUser.getIdToken();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", kind);
        const res = await fetch(`/api/chat/${activeId}/attachments`, {
          method: "POST",
          headers: { Authorization: `Bearer ${freshToken}` },
          body: formData,
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: null }));
          setAttachError(error ?? "Upload failed. Please try again.");
          return;
        }
        const { id, created_at, metadata } = await res.json();
        setMessages((prev) =>
          appendUnique(prev, [
            {
              id,
              sender_id: uid,
              body: file.name,
              msg_type: "file",
              metadata: JSON.stringify(metadata),
              created_at,
              read_at: null,
            },
          ]),
        );
        lastTsRef.current = created_at;
        if (token) loadInbox(token);
      } catch (err) {
        console.error("[uploadAttachment]", err);
        setAttachError("Upload failed. Please try again.");
      } finally {
        setUploadingAttachment(false);
      }
    },
    [activeId, authUser, uid, token, loadInbox],
  );

  /* ── Send a "propose viewing times" message ── */
  const sendViewingTimes = useCallback(
    async (slots: ProposedSlot[]) => {
      if (!activeId || !authUser || slots.length === 0) return;
      try {
        const freshToken = await authUser.getIdToken();
        const metadata = { slots, status: "pending" as const };
        const res = await fetch(`/api/chat/${activeId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${freshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: `Proposed ${slots.length} viewing time${slots.length > 1 ? "s" : ""}`,
            msg_type: "viewing_times",
            metadata,
          }),
        });
        if (!res.ok) return;
        const { id, created_at } = await res.json();
        setMessages((prev) =>
          appendUnique(prev, [
            {
              id,
              sender_id: uid,
              body: `Proposed ${slots.length} viewing time${slots.length > 1 ? "s" : ""}`,
              msg_type: "viewing_times",
              metadata: JSON.stringify(metadata),
              created_at,
              read_at: null,
            },
          ]),
        );
        lastTsRef.current = created_at;
        setProposeTimesOpen(false);
        if (token) loadInbox(token);
      } catch (err) {
        console.error("[sendViewingTimes]", err);
      }
    },
    [activeId, authUser, uid, token, loadInbox],
  );

  /* ── Respond to a booking/viewing card ── */
  const respondToBooking = useCallback(
    async (messageId: string, status: "accepted" | "declined") => {
      if (!activeId) return;
      try {
        const freshToken = await authUser?.getIdToken();
        const res = await fetch(
          `/api/chat/${activeId}/messages/${messageId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${freshToken ?? token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          },
        );
        if (!res.ok) return;
        const { metadata, confirmation } = await res.json();
        setMessages((prev) => {
          const mapped = prev.map((m) => (m.id === messageId ? { ...m, metadata } : m));
          return appendUnique(mapped, [
            {
              id: confirmation.id,
              sender_id: uid,
              body:
                status === "accepted"
                  ? "Request accepted ✓"
                  : "Request declined",
              msg_type: "text",
              metadata: null,
              created_at: confirmation.created_at,
              read_at: null,
            },
          ]);
        });
        lastTsRef.current = confirmation.created_at;
        if (token) loadInbox(token);
      } catch (err) {
        console.error("[respondToBooking]", err);
      }
    },
    [activeId, token, authUser, uid, loadInbox],
  );

  /* ── Select one of several proposed viewing times ── */
  const selectViewingSlot = useCallback(
    async (messageId: string, selectedIndex: number) => {
      if (!activeId) return;
      try {
        const freshToken = await authUser?.getIdToken();
        const res = await fetch(
          `/api/chat/${activeId}/messages/${messageId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${freshToken ?? token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ selectedIndex }),
          },
        );
        if (!res.ok) return;
        const { metadata, confirmation } = await res.json();
        setMessages((prev) => {
          const mapped = prev.map((m) => (m.id === messageId ? { ...m, metadata } : m));
          return appendUnique(mapped, [
            {
              id: confirmation.id,
              sender_id: uid,
              body: confirmation.body,
              msg_type: "text",
              metadata: null,
              created_at: confirmation.created_at,
              read_at: null,
            },
          ]);
        });
        lastTsRef.current = confirmation.created_at;
        if (token) loadInbox(token);
      } catch (err) {
        console.error("[selectViewingSlot]", err);
      }
    },
    [activeId, token, authUser, uid, loadInbox],
  );

  /* ── Conversation menu actions (mute / block / report / delete) ── */
  const patchPreferences = useCallback(
    async (patch: Record<string, unknown>) => {
      const freshToken = await authUser?.getIdToken();
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${freshToken ?? token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
    },
    [authUser, token],
  );

  const toggleMuteThread = useCallback(() => {
    if (!activeThread) return;
    const current = myPrefs.mutedThreads ?? [];
    const isMuted = current.includes(activeThread.inquiry_id);
    const next = isMuted
      ? current.filter((id) => id !== activeThread.inquiry_id)
      : [...current, activeThread.inquiry_id];
    setMyPrefs((p) => ({ ...p, mutedThreads: next }));
    setOverflowMenuOpen(false);
    patchPreferences({ mutedThreads: next });
  }, [activeThread, myPrefs.mutedThreads, patchPreferences]);

  const toggleBlockUser = useCallback(() => {
    if (!activeThread?.other_id) return;
    const otherId = activeThread.other_id;
    const current = myPrefs.blockedUsers ?? [];
    const isBlocked = current.includes(otherId);
    const next = isBlocked
      ? current.filter((id) => id !== otherId)
      : [...current, otherId];
    setMyPrefs((p) => ({ ...p, blockedUsers: next }));
    setOverflowMenuOpen(false);
    patchPreferences({ blockedUsers: next });
  }, [activeThread, myPrefs.blockedUsers, patchPreferences]);

  const openReportModal = useCallback(() => {
    if (!activeThread?.other_id) return;
    setOverflowMenuOpen(false);
    setReportModalOpen(true);
  }, [activeThread]);

  const submitReport = useCallback(async (reason: string) => {
    if (!activeThread?.other_id) return;
    setReportedThreadIds((prev) => new Set(prev).add(activeThread.inquiry_id));
    setReportModalOpen(false);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(`${activeThread.other_name ?? "User"} reported`);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
    const freshToken = await authUser?.getIdToken();
    await fetch("/api/reports", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${freshToken ?? token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetType: "user",
        targetId: activeThread.other_id,
        reason,
        inquiryId: activeThread.inquiry_id,
      }),
    });
  }, [activeThread, authUser, token]);

  const deleteActiveConversation = useCallback(() => {
    if (!activeThread) return;
    const inquiryId = activeThread.inquiry_id;
    const nextHidden = {
      ...(myPrefs.hiddenThreads ?? {}),
      [inquiryId]: Date.now(),
    };
    setMyPrefs((p) => ({ ...p, hiddenThreads: nextHidden }));
    setThreads((prev) => prev.filter((t) => t.inquiry_id !== inquiryId));
    setActiveId(null);
    setOverflowMenuOpen(false);
    patchPreferences({ hiddenThreads: nextHidden });
  }, [activeThread, myPrefs.hiddenThreads, patchPreferences]);

  const overflowMenuItems = useMemo<MenuItem[]>(() => {
    if (!activeThread) return [];
    const otherName = activeThread.other_name ?? "this user";
    const isSupport = activeThread.type === "support";
    const isMuted = (myPrefs.mutedThreads ?? []).includes(
      activeThread.inquiry_id,
    );
    const isBlocked = !!(
      activeThread.other_id &&
      (myPrefs.blockedUsers ?? []).includes(activeThread.other_id)
    );
    const alreadyReported = reportedThreadIds.has(activeThread.inquiry_id);

    const items: MenuItem[] = [];
    if (activeThread.listing_id) {
      items.push({
        key: "view-listing",
        label: "View listing",
        icon: <MenuIcon d={MENU_ICON_PATHS.listing} />,
        onClick: () => {
          window.open(`/search/${activeThread.listing_id}`, "_blank");
          setOverflowMenuOpen(false);
        },
      });
    }
    items.push({
      key: "search",
      label: "Search in conversation",
      icon: <MenuIcon d={MENU_ICON_PATHS.search} />,
      onClick: () => {
        setSearchOpen(true);
        setOverflowMenuOpen(false);
      },
    });
    if (!isSupport) {
      items.push(
        {
          key: "mute",
          label: isMuted ? "Unmute notifications" : "Mute notifications",
          icon: <MenuIcon d={MENU_ICON_PATHS.mute} />,
          onClick: toggleMuteThread,
        },
        {
          key: "report",
          label: alreadyReported ? "Reported" : "Report user",
          icon: <MenuIcon d={MENU_ICON_PATHS.report} />,
          onClick: openReportModal,
          disabled: alreadyReported,
          divider: true,
        },
        {
          key: "block",
          label: isBlocked ? `Unblock ${otherName}` : `Block ${otherName}`,
          icon: <MenuIcon d={MENU_ICON_PATHS.block} />,
          onClick: toggleBlockUser,
          destructive: true,
        },
      );
    }
    items.push({
      key: "delete",
      label: "Delete conversation",
      icon: <MenuIcon d={MENU_ICON_PATHS.deleteConvo} />,
      onClick: deleteActiveConversation,
      destructive: true,
      divider: isSupport,
    });
    return items;
  }, [
    activeThread,
    myPrefs.mutedThreads,
    myPrefs.blockedUsers,
    reportedThreadIds,
    toggleMuteThread,
    toggleBlockUser,
    openReportModal,
    deleteActiveConversation,
  ]);

  const attachMenuItems = useMemo<MenuItem[]>(
    () => [
      {
        key: "photo",
        label: "Photo",
        icon: <MenuIcon d={MENU_ICON_PATHS.photo} />,
        iconBg: "#f3effe",
        iconColor: "#6d28d9",
        onClick: () => {
          setAttachMenuOpen(false);
          photoInputRef.current?.click();
        },
      },
      {
        key: "document",
        label: "Document",
        icon: <MenuIcon d={MENU_ICON_PATHS.document} />,
        iconBg: "#eafaf2",
        iconColor: "#1f8a5b",
        onClick: () => {
          setAttachMenuOpen(false);
          documentInputRef.current?.click();
        },
      },
      {
        key: "viewing-time",
        label: "Propose viewing time",
        icon: <MenuIcon d={MENU_ICON_PATHS.calendar} />,
        iconBg: "#eef2ff",
        iconColor: "#4f46e5",
        onClick: () => {
          setAttachMenuOpen(false);
          setProposeTimesOpen(true);
        },
      },
    ],
    [],
  );

  const visibleMessages = useMemo(() => {
    if (!searchOpen || !searchQuery.trim()) return messages;
    const q = searchQuery.trim().toLowerCase();
    return messages.filter((m) => m.body.toLowerCase().includes(q));
  }, [messages, searchOpen, searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  /* ── Render ── */
  return (
    <div className={styles.page}>
      <AppNav />

      {/* Workspace */}
      <div
        className={`${styles.workspace}${activeId ? ` ${styles.mobileShowChat}` : ""}`}
      >
        {/* ── Left: thread list ── */}
        <div className={styles.threadPanel}>
          <div className={styles.threadPanelHeader}>
            <div className={styles.threadPanelTop}>
              <h1 className={styles.threadPanelTitle}>Messages</h1>
            </div>
            <div className={styles.searchBar}>
              <ISearch />
              <span className={styles.searchPlaceholder}>
                Search people or listings
              </span>
            </div>
          </div>

          <div className={`${styles.threadList} us-scroll`}>
            {loadingInbox && (
              <div
                style={{
                  padding: "32px 22px",
                  textAlign: "center",
                  color: "var(--text-soft)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Loading…
              </div>
            )}
            {!loadingInbox && threads.length === 0 && (
              <div
                style={{
                  padding: "40px 22px",
                  textAlign: "center",
                  color: "var(--text-soft)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {authResolved && !authUser ? (
                  <>
                    <a
                      href="/login"
                      style={{ color: "var(--brand)", fontWeight: 700 }}
                    >
                      Sign in
                    </a>{" "}
                    to see your messages.
                  </>
                ) : (
                  "No conversations yet."
                )}
              </div>
            )}
            {threads.map((t) => {
              const isActive = t.inquiry_id === activeId;
              const rs = ROLE_STYLE[t.other_role] ?? ROLE_STYLE.default;
              const displayName =
                t.other_name ?? (t.other_id ? t.other_id.slice(0, 8) : "Host");
              const previewPrefix = t.last_sender_id === uid ? "You: " : "";
              const preview = t.last_body
                ? t.last_type !== "text"
                  ? `📎 ${t.last_type}`
                  : `${previewPrefix}${t.last_body}`
                : "No messages yet";

              return (
                <div
                  key={t.inquiry_id}
                  onClick={() => selectThread(t.inquiry_id)}
                  className={[
                    styles.threadRow,
                    isActive ? styles.threadRowActive : "",
                    !isActive && t.unread_count > 0
                      ? styles.threadRowUnread
                      : "",
                  ].join(" ")}
                >
                  <div className={styles.threadAvatarWrap}>
                    <div
                      className={styles.threadAvatar}
                      style={{
                        background: avatarGradient(t.other_id ?? t.inquiry_id),
                      }}
                    >
                      {initial(t.other_name, t.other_id ?? t.inquiry_id)}
                    </div>
                  </div>
                  <div className={styles.threadMeta}>
                    <div className={styles.threadNameRow}>
                      <span className={styles.threadName}>{displayName}</span>
                      <span
                        className={styles.roleChip}
                        style={{ color: rs.color, background: rs.bg }}
                      >
                        {roleLabel(t.other_role)}
                      </span>
                      <span
                        className={styles.threadTime}
                        style={{
                          color: t.unread_count > 0 ? "#6d28d9" : "#b0aabf",
                        }}
                      >
                        {t.last_at ? fmtTime(t.last_at) : ""}
                      </span>
                    </div>
                    {t.listing_title && (
                      <div className={styles.listingPill}>
                        <div
                          className={styles.listingThumb}
                          style={{ background: listingThumb(t.listing_id ?? "") }}
                        />
                        <span className={styles.listingPillText}>
                          {t.listing_title} · {t.listing_city}
                        </span>
                      </div>
                    )}
                    {!t.listing_title && t.subject && (
                      <div className={styles.listingPill} style={{ paddingLeft: 9 }}>
                        <span className={styles.listingPillText}>{t.subject}</span>
                      </div>
                    )}
                    <div className={styles.threadPreviewRow}>
                      <span
                        className={styles.threadPreview}
                        style={{
                          fontWeight: t.unread_count > 0 ? 700 : 600,
                          color: t.unread_count > 0 ? "#1c1530" : "#9a94a8",
                        }}
                      >
                        {preview}
                      </span>
                      {t.unread_count > 0 && (
                        <span className={styles.unreadBadge}>
                          {t.unread_count}
                        </span>
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
              <div className={styles.emptyIcon}>
                <IMsg />
              </div>
              <p className={styles.emptyTitle}>Your messages</p>
              <p className={styles.emptyDesc}>
                Select a conversation to start chatting.
              </p>
            </div>
          ) : (
            <>
              {/* header */}
              <div className={styles.chatHeader}>
                <button
                  className={styles.mobileBackBtn}
                  onClick={() => setActiveId(null)}
                  aria-label="Back"
                >
                  <IBack />
                </button>
                <div className={styles.chatHeaderAvatar}>
                  <div
                    className={styles.chatAvatar}
                    style={{
                      background: avatarGradient(
                        activeThread.other_id ?? activeThread.inquiry_id,
                      ),
                    }}
                  >
                    {initial(
                      activeThread.other_name,
                      activeThread.other_id ?? activeThread.inquiry_id,
                    )}
                  </div>
                </div>
                <div className={styles.chatHeaderMeta}>
                  <div className={styles.chatHeaderNameRow}>
                    <span className={styles.chatHeaderName}>
                      {activeThread.other_name ??
                        (activeThread.other_id
                          ? activeThread.other_id.slice(0, 8)
                          : "Host")}
                    </span>
                    {activeThread.other_role === "landlord" && (
                      <span className={styles.hostChip}>
                        <IVerify /> HOST
                      </span>
                    )}
                  </div>
                  <div className={styles.chatHeaderStatus}>
                    {activeThread.listing_title
                      ? `${activeThread.listing_title} · ${activeThread.listing_city}`
                      : `Ticket #${ticketRef(activeThread.ticket_no, activeThread.inquiry_id)}${activeThread.subject ? ` · ${activeThread.subject}` : ""}`}
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    className={styles.moreBtn}
                    onClick={() => setOverflowMenuOpen((o) => !o)}
                    aria-label="Conversation menu"
                  >
                    <IMore />
                  </button>
                  <MenuSheet
                    open={overflowMenuOpen}
                    onClose={() => setOverflowMenuOpen(false)}
                    items={overflowMenuItems}
                    align="below-right"
                  />
                </div>
              </div>

              {searchOpen && (
                <div className={styles.inlineSearchBar}>
                  <ISearch />
                  <input
                    autoFocus
                    className={styles.inlineSearchInput}
                    placeholder="Search in this conversation…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    className={styles.inlineSearchClose}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    aria-label="Close search"
                  >
                    ×
                  </button>
                </div>
              )}

              {isBlocked && (
                <div className={styles.blockedBanner}>
                  You&apos;ve blocked {activeThread.other_name ?? "this user"}. Unblock them from the conversation menu to send messages.
                </div>
              )}

              {/* pinned listing */}
              {activeThread.listing_title && activeThread.listing_id && (
                <div className={styles.pinnedListing}>
                  <div
                    className={styles.pinnedThumb}
                    style={{ background: listingThumb(activeThread.listing_id) }}
                  />
                  <div className={styles.pinnedMeta}>
                    <div className={styles.pinnedTitle}>
                      {activeThread.listing_title} · {activeThread.listing_city}
                    </div>
                    <div className={styles.pinnedPrice}>
                      €{activeThread.cold_rent}/mo · about this listing
                    </div>
                  </div>
                  <button
                    className={styles.viewListingBtn}
                    onClick={() =>
                      window.open(`/search/${activeThread.listing_id}`, "_blank")
                    }
                  >
                    View listing
                  </button>
                </div>
              )}

              {/* pinned support ticket */}
              {!activeThread.listing_title && activeThread.other_role === "support" && (
                <div className={styles.pinnedListing}>
                  <div
                    className={styles.pinnedThumb}
                    style={{
                      background: "linear-gradient(180deg, #7c3aed, #6d28d9)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <path d="m4.9 4.9 4.2 4.2M19.1 4.9l-4.2 4.2M4.9 19.1l4.2-4.2M19.1 19.1l-4.2-4.2" />
                    </svg>
                  </div>
                  <div className={styles.pinnedMeta}>
                    <div className={styles.pinnedTitle}>
                      {activeThread.subject ?? "Support ticket"}
                    </div>
                    <div className={styles.pinnedPrice}>
                      Ticket #{ticketRef(activeThread.ticket_no, activeThread.inquiry_id)}
                    </div>
                  </div>
                </div>
              )}

              {/* messages */}
              <div className={`${styles.messages} us-scroll`}>
                {loadingThread && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "var(--text-soft)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Loading messages…
                  </div>
                )}
                {!loadingThread && messages.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "var(--text-soft)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    No messages yet. Say hello!
                  </div>
                )}
                {searchOpen && searchQuery.trim() && visibleMessages.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--text-soft)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    No messages match &quot;{searchQuery}&quot;
                  </div>
                )}
                {visibleMessages.map((msg, i) => {
                  const prev = visibleMessages[i - 1];
                  const showDate =
                    !prev ||
                    new Date(msg.created_at).toDateString() !==
                      new Date(prev.created_at).toDateString();
                  return (
                    <div key={msg.id} style={{ display: "contents" }}>
                      {showDate && (
                        <div className={styles.dateDivider}>
                          <span className={styles.dateDividerLine} />
                          <span className={styles.dateDividerLabel}>
                            {new Date(msg.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              },
                            )}
                          </span>
                          <span className={styles.dateDividerLine} />
                        </div>
                      )}
                      <MessageBubble
                        msg={msg}
                        uid={uid}
                        thread={activeThread}
                        onRespond={respondToBooking}
                        onSelectViewingSlot={selectViewingSlot}
                      />
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* composer */}
              <div className={styles.composer}>
                {attachError && (
                  <div className={styles.attachErrorBanner}>{attachError}</div>
                )}
                <div className={styles.quickReplies}>
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      className={styles.quickReplyBtn}
                      onClick={() => setInput(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className={styles.composerRow}>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAttachment(file, "photo");
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept="application/pdf,.doc,.docx"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAttachment(file, "document");
                      e.target.value = "";
                    }}
                  />
                  <div style={{ position: "relative" }}>
                    <button
                      className={styles.attachBtn}
                      onClick={() => setAttachMenuOpen((o) => !o)}
                      disabled={isBlocked || uploadingAttachment}
                      aria-label="Add attachment"
                    >
                      <IAttach />
                    </button>
                    <MenuSheet
                      open={attachMenuOpen}
                      onClose={() => setAttachMenuOpen(false)}
                      items={attachMenuItems}
                      align="above-left"
                      mobileLayout="grid"
                    />
                  </div>
                  <div className={styles.inputWrap}>
                    <input
                      className={styles.composerInput}
                      placeholder={
                        isBlocked
                          ? "You've blocked this user"
                          : uploadingAttachment
                            ? "Uploading…"
                            : `Message ${activeThread.other_name?.split(" ")[0] ?? "them"}…`
                      }
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending || isBlocked}
                    />
                    <button
                      className={styles.sendBtn}
                      onClick={send}
                      disabled={sending || !input.trim() || isBlocked}
                    >
                      <ISend />
                    </button>
                  </div>
                </div>
              </div>

              <ProposeTimesSheet
                open={proposeTimesOpen}
                onClose={() => setProposeTimesOpen(false)}
                onSend={sendViewingTimes}
                listingTitle={activeThread.listing_title}
                listingCity={activeThread.listing_city}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className={styles.mobileNav}>
        {[
          {
            label: "Explore",
            href: "/",
            icon: (
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            ),
          },
          {
            label: "Saved",
            href: "/saved",
            icon: (
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
              </svg>
            ),
          },
          {
            label: "Messages",
            href: "/messages",
            active: true,
            icon: (
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ),
          },
          {
            label: "Profile",
            href: "/settings",
            icon: (
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              </svg>
            ),
          },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`${styles.mobileNavItem}${item.active ? ` ${styles.mobileNavItemActive}` : ""}`}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      {reportModalOpen && activeThread && (
        <ReportUserModal
          targetName={activeThread.other_name ?? "user"}
          onClose={() => setReportModalOpen(false)}
          onSubmit={submitReport}
        />
      )}

      {toastMessage && (
        <div className={styles.reportToast}>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
