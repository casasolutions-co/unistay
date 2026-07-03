import { d1All, d1First, d1Run, nowSeconds, relativeTime, toMs } from './d1'
import type { User, Listing, Message, MessageThread, ThreadMessage, Document, Report, AppSetting, AuditLogEntry, DashboardCounts } from './types'
import { findStaticListing } from './staticListings'
import { deletePhoto } from './r2'

function inClause(n: number): string {
  return Array.from({ length: n }, () => '?').join(',')
}

// ─── Row shapes (snake_case, as stored in D1) ─────────────────────────────────

interface UserRow {
  id: string
  name: string | null
  email: string
  phone: string | null
  university: string | null
  verification_status: string
  verification_note: string | null
  banned_at: number | null
  ban_reason: string | null
  ban_expires_at: number | null
  created_at: number | null
}

interface ListingRow {
  id: string
  title: string
  landlord_id: string
  host: string | null
  city: string | null
  cold_rent: number | null
  status: string
  rejection_reason: string | null
  created_at: number | null
  description: string | null
  ptype: string | null
  bedrooms: number | null
  bathrooms: number | null
  size_sqm: number | null
  utilities: number | null
  deposit: number | null
  source?: string | null
}

interface MessageRow {
  id: string
  inquiry_id: string
  body: string
  created_at: number | null
  deleted_at: number | null
  listing_title: string | null
  student_name: string | null
  landlord_name: string | null
}

interface DocRow {
  id: string
  user_id: string
  user_name: string | null
  doc_type: string
  status: string
  rejection_reason: string | null
  created_at: number | null
}

interface ReportRow {
  id: string
  target_type: string
  target_id: string
  reason: string
  status: string
  created_at: number | null
  resolved_at: number | null
  resolution_note: string | null
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function thumbFor(id: string): number {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return sum % 3
}

function mapUser(r: UserRow): User {
  return {
    id: r.id,
    name: r.name ?? '(no name)',
    email: r.email,
    phone: r.phone ?? '—',
    university: r.university ?? '—',
    joined: relativeTime(r.created_at),
    status: r.banned_at ? 'banned' : (r.verification_status as User['status']),
    verificationNote: r.verification_note,
    bannedAt: r.banned_at ? relativeTime(r.banned_at) : null,
    banReason: r.ban_reason,
    banExpiresAt: r.ban_expires_at ? new Date(r.ban_expires_at * 1000).toISOString() : null,
  }
}

function mapListing(r: ListingRow, amenities?: string[], photoKeys?: string[]): Listing {
  return {
    id: r.id,
    title: r.title,
    hostId: r.landlord_id,
    host: r.host ?? '(unknown host)',
    location: r.city ?? '—',
    price: r.cold_rent != null ? `€${r.cold_rent}/mo` : '—',
    submitted: relativeTime(r.created_at),
    status: r.status as Listing['status'],
    rejectionReason: r.rejection_reason,
    thumb: thumbFor(r.id),
    description: r.description,
    ptype: r.ptype,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    sizeSqm: r.size_sqm,
    coldRent: r.cold_rent,
    utilities: r.utilities,
    deposit: r.deposit,
    amenities,
    photoKeys,
    source: r.source === 'casa' ? 'casa' : 'private',
  }
}

function mapMessage(r: MessageRow): Message {
  return {
    id: r.id,
    inquiryId: r.inquiry_id,
    userA: r.student_name ?? '(unknown student)',
    userB: r.landlord_name ?? '(unknown landlord)',
    listing: r.listing_title,
    preview: r.deleted_at ? '[message removed by moderator]' : r.body,
    time: relativeTime(r.created_at),
    deletedAt: r.deleted_at ? relativeTime(r.deleted_at) : null,
  }
}

function mapDoc(r: DocRow): Document {
  return {
    id: r.id,
    userId: r.user_id,
    user: r.user_name ?? '(unknown user)',
    type: r.doc_type,
    uploaded: relativeTime(r.created_at),
    status: r.status as Document['status'],
    rejectionReason: r.rejection_reason,
  }
}

async function reportSummary(targetType: string, targetId: string): Promise<string> {
  if (targetType === 'message') {
    const row = await d1First<MessageRow>(
      `SELECT m.id as id, i.student_id, m.body, m.created_at, m.deleted_at,
              l.title as listing_title, su.name as student_name, lu.name as landlord_name
       FROM messages m
       JOIN inquiries i ON i.id = m.inquiry_id
       JOIN listings l ON l.id = i.listing_id
       JOIN users su ON su.id = i.student_id
       JOIN users lu ON lu.id = l.landlord_id
       WHERE m.id = ?`,
      [targetId]
    )
    return row ? `${row.student_name ?? '(unknown)'} ↔ ${row.landlord_name ?? '(unknown)'}` : targetId
  }
  if (targetType === 'listing') {
    const row = await d1First<{ title: string }>(`SELECT title FROM listings WHERE id = ?`, [targetId])
    return row?.title ?? targetId
  }
  if (targetType === 'user') {
    const row = await d1First<{ name: string | null }>(`SELECT name FROM users WHERE id = ?`, [targetId])
    return row?.name ?? targetId
  }
  return targetId
}

async function reportHref(targetType: string, targetId: string): Promise<string> {
  if (targetType === 'message') {
    const row = await d1First<{ inquiry_id: string }>(`SELECT inquiry_id FROM messages WHERE id = ?`, [targetId])
    return row ? `/messages?thread=${row.inquiry_id}` : '/messages'
  }
  if (targetType === 'inquiry') return `/messages?thread=${targetId}`
  if (targetType === 'listing') return `/listings/${targetId}`
  if (targetType === 'user') return `/users/${targetId}`
  return '#'
}

const MESSAGE_SELECT = `
  SELECT m.id as id, m.inquiry_id as inquiry_id, m.body as body, m.created_at as created_at, m.deleted_at as deleted_at,
         l.title as listing_title, su.name as student_name, lu.name as landlord_name
  FROM messages m
  JOIN inquiries i ON i.id = m.inquiry_id
  JOIN listings l ON l.id = i.listing_id
  JOIN users su ON su.id = i.student_id
  JOIN users lu ON lu.id = l.landlord_id
  WHERE m.id IN (
    SELECT m2.id FROM messages m2 WHERE m2.inquiry_id = i.id ORDER BY m2.created_at DESC LIMIT 1
  )
`

// ─── Query functions ───────────────────────────────────────────────────────────

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [users, listings, messages, documents, reports] = await Promise.all([
    d1First<{ n: number }>(`SELECT COUNT(*) as n FROM users WHERE verification_status IN ('unverified','pending')`),
    d1First<{ n: number }>(`SELECT COUNT(*) as n FROM listings WHERE status = 'pending_review'`),
    d1First<{ n: number }>(`SELECT COUNT(*) as n FROM reports WHERE target_type = 'message' AND status = 'open'`),
    d1First<{ n: number }>(`SELECT COUNT(*) as n FROM verification_docs WHERE status = 'pending'`),
    d1First<{ n: number }>(`SELECT COUNT(*) as n FROM reports WHERE status = 'open'`),
  ])
  return {
    users: users?.n ?? 0,
    listings: listings?.n ?? 0,
    messages: messages?.n ?? 0,
    documents: documents?.n ?? 0,
    reports: reports?.n ?? 0,
  }
}

export async function getAttentionUsers(): Promise<User[]> {
  const rows = await d1All<UserRow>(
    `SELECT * FROM users WHERE verification_status IN ('unverified','pending') ORDER BY created_at DESC LIMIT 4`
  )
  return rows.map(mapUser)
}

export async function getAttentionListings(): Promise<Listing[]> {
  const rows = await d1All<ListingRow>(
    `SELECT l.*, lu.name as host FROM listings l JOIN users lu ON lu.id = l.landlord_id
     WHERE l.status = 'pending_review' ORDER BY l.created_at DESC LIMIT 4`
  )
  return rows.map(r => mapListing(r))
}

export async function getUsers(opts: { filter?: string; q?: string } = {}): Promise<User[]> {
  const clauses: string[] = []
  const params: (string | number)[] = []
  if (opts.filter && opts.filter !== 'all') {
    clauses.push(`(CASE WHEN banned_at IS NOT NULL THEN 'banned' ELSE verification_status END) = ?`)
    params.push(opts.filter)
  }
  if (opts.q) {
    clauses.push(`(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)`)
    const q = `%${opts.q.toLowerCase()}%`
    params.push(q, q)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = await d1All<UserRow>(`SELECT * FROM users ${where} ORDER BY created_at DESC`, params)
  return rows.map(mapUser)
}

export async function getUser(id: string): Promise<User | null> {
  const row = await d1First<UserRow>(`SELECT * FROM users WHERE id = ?`, [id])
  return row ? mapUser(row) : null
}

export async function getListings(opts: { filter?: string; q?: string } = {}): Promise<Listing[]> {
  const clauses: string[] = []
  const params: (string | number)[] = []
  if (opts.filter && opts.filter !== 'all') {
    clauses.push(`l.status = ?`)
    params.push(opts.filter)
  }
  if (opts.q) {
    clauses.push(`(LOWER(l.title) LIKE ? OR LOWER(lu.name) LIKE ?)`)
    const q = `%${opts.q.toLowerCase()}%`
    params.push(q, q)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = await d1All<ListingRow>(
    `SELECT l.*, lu.name as host FROM listings l LEFT JOIN users lu ON lu.id = l.landlord_id ${where} ORDER BY l.created_at DESC`,
    params
  )
  return rows.map(r => mapListing(r.host ? r : { ...r, host: 'UniStay CASA' }))
}

export async function getCasaListings(opts: { q?: string } = {}): Promise<Listing[]> {
  const clauses: string[] = [`l.source = 'casa'`]
  const params: (string | number)[] = []
  if (opts.q) {
    clauses.push(`LOWER(l.title) LIKE ?`)
    params.push(`%${opts.q.toLowerCase()}%`)
  }
  const rows = await d1All<ListingRow>(
    `SELECT l.* FROM listings l WHERE ${clauses.join(' AND ')} ORDER BY l.created_at DESC`,
    params
  )
  return rows.map(r => mapListing({ ...r, host: 'UniStay CASA' }))
}

export async function _deleteCasaListing(id: string) {
  await d1Run(`DELETE FROM listing_photos WHERE listing_id = ?`, [id])
  await d1Run(`DELETE FROM listing_amenities WHERE listing_id = ?`, [id])
  await d1Run(`DELETE FROM listings WHERE id = ? AND source = 'casa'`, [id])
}

export async function getListing(id: string): Promise<Listing | null> {
  const [row, amenityRows, photoRows] = await Promise.all([
    d1First<ListingRow>(
      `SELECT l.*, lu.name as host FROM listings l LEFT JOIN users lu ON lu.id = l.landlord_id WHERE l.id = ?`,
      [id]
    ),
    d1All<{ amenity: string }>(`SELECT amenity FROM listing_amenities WHERE listing_id = ?`, [id]),
    d1All<{ r2_key: string }>(`SELECT r2_key FROM listing_photos WHERE listing_id = ? ORDER BY position`, [id]),
  ])
  if (!row) return null
  const withHost = row.host ? row : { ...row, host: 'UniStay CASA' }
  return mapListing(withHost, amenityRows.map(a => a.amenity), photoRows.map(p => p.r2_key))
}

interface ThreadRow {
  inquiry_id: string
  listing_id: string
  listing_title: string | null
  listing_city: string | null
  cold_rent: number | null
  student_id: string
  student_name: string | null
  landlord_id: string | null
  landlord_name: string | null
  last_body: string | null
  last_at: number | null
  last_deleted_at: number | null
}

// listings is a LEFT JOIN: inquiries can point at a static/partner listing_id
// (e.g. CASA properties baked into the student app) that never got a row in
// the D1 listings table, and those conversations still need to show up here.
const THREAD_META_SELECT = `
  SELECT i.id as inquiry_id, i.listing_id, l.title as listing_title, l.city as listing_city, l.cold_rent,
         i.student_id, su.name as student_name, l.landlord_id, lu.name as landlord_name
  FROM inquiries i
  LEFT JOIN listings l ON l.id = i.listing_id
  JOIN users su ON su.id = i.student_id
  LEFT JOIN users lu ON lu.id = l.landlord_id
`

function mapThreadMeta(r: ThreadRow): MessageThread {
  // CASA/PARTNER listings are static data with no D1 row by design (see
  // reference/html_files/ADMIN_PANEL_PLAN.md §3) — fall back to that catalog
  // so these conversations still show a real title/city/price.
  const fallback = r.listing_title ? undefined : findStaticListing(r.listing_id)
  return {
    inquiryId: r.inquiry_id,
    listingId: r.listing_id,
    listingTitle: r.listing_title ?? fallback?.title ?? null,
    listingCity: r.listing_city ?? fallback?.city ?? null,
    coldRent: r.cold_rent ?? fallback?.coldRent ?? null,
    studentId: r.student_id,
    studentName: r.student_name ?? '(unknown student)',
    landlordId: r.landlord_id,
    landlordName: r.landlord_name ?? (r.landlord_id ? '(unknown landlord)' : fallback?.badge === 'PARTNER' ? 'Partner host' : 'UniStay CASA'),
  }
}

// One row per conversation (inquiry) that has at least one message, newest activity first.
export async function getMessageThreads(opts: { filter?: string } = {}): Promise<MessageThread[]> {
  const [rows, reportedRows] = await Promise.all([
    d1All<ThreadRow>(
      `SELECT i.id as inquiry_id, i.listing_id, l.title as listing_title, l.city as listing_city, l.cold_rent,
              i.student_id, su.name as student_name, l.landlord_id, lu.name as landlord_name,
              m.body as last_body, m.created_at as last_at, m.deleted_at as last_deleted_at
       FROM inquiries i
       LEFT JOIN listings l ON l.id = i.listing_id
       JOIN users su ON su.id = i.student_id
       LEFT JOIN users lu ON lu.id = l.landlord_id
       JOIN messages m ON m.id = (SELECT id FROM messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1)
       ORDER BY m.created_at DESC`
    ),
    d1All<{ inquiry_id: string }>(
      `SELECT DISTINCT m.inquiry_id as inquiry_id
       FROM reports r JOIN messages m ON m.id = r.target_id AND r.target_type = 'message'
       WHERE r.status = 'open'`
    ),
  ])
  const reportedIds = new Set(reportedRows.map(r => r.inquiry_id))
  const threads = rows.map(r => ({
    ...mapThreadMeta(r),
    lastBody: r.last_deleted_at ? '[message removed by moderator]' : r.last_body,
    lastAt: relativeTime(r.last_at),
    reported: reportedIds.has(r.inquiry_id),
  }))
  return opts.filter === 'reported' ? threads.filter(t => t.reported) : threads
}

export async function getThreadMeta(inquiryId: string): Promise<MessageThread | null> {
  const row = await d1First<ThreadRow>(`${THREAD_META_SELECT} WHERE i.id = ?`, [inquiryId])
  return row ? mapThreadMeta(row) : null
}

interface ThreadMessageRow {
  id: string
  sender_id: string
  body: string
  msg_type: string | null
  metadata: string | null
  created_at: number | null
  deleted_at: number | null
  read_at: number | null
  report_id: string | null
  report_reason: string | null
}

// Full message history for one conversation, oldest first. A sender that is
// neither the student nor the (real) landlord is an admin replying directly
// in the conversation — for support, or standing in as the host on CASA
// listings that have no real landlord.
export async function getThreadMessages(inquiryId: string, studentId: string, landlordId: string | null): Promise<ThreadMessage[]> {
  const rows = await d1All<ThreadMessageRow>(
    `SELECT m.id, m.sender_id, m.body, m.msg_type, m.metadata, m.created_at, m.deleted_at, m.read_at,
            r.id as report_id, r.reason as report_reason
     FROM messages m
     LEFT JOIN reports r ON r.target_type = 'message' AND r.target_id = m.id AND r.status = 'open'
     WHERE m.inquiry_id = ?
     ORDER BY m.created_at ASC`,
    [inquiryId]
  )
  return rows.map(r => ({
    id: r.id,
    senderId: r.sender_id,
    senderRole: r.sender_id === studentId ? 'student' : landlordId && r.sender_id === landlordId ? 'landlord' : 'admin',
    readAtMs: toMs(r.read_at),
    body: r.deleted_at ? '[message removed by moderator]' : r.body,
    msgType: r.msg_type ?? 'text',
    metadata: r.metadata,
    createdAtMs: toMs(r.created_at),
    deletedAt: r.deleted_at ? relativeTime(r.deleted_at) : null,
    reportId: r.report_id,
    reportReason: r.report_reason,
  }))
}

export async function getDocuments(opts: { filter?: string } = {}): Promise<Document[]> {
  const clauses: string[] = []
  const params: string[] = []
  if (opts.filter && opts.filter !== 'all') {
    clauses.push(`v.status = ?`)
    params.push(opts.filter)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = await d1All<DocRow>(
    `SELECT v.*, u.name as user_name FROM verification_docs v JOIN users u ON u.id = v.user_id ${where} ORDER BY v.created_at DESC`,
    params
  )
  return rows.map(mapDoc)
}

export async function getDocument(id: string): Promise<Document | null> {
  const row = await d1First<DocRow>(
    `SELECT v.*, u.name as user_name FROM verification_docs v JOIN users u ON u.id = v.user_id WHERE v.id = ?`,
    [id]
  )
  return row ? mapDoc(row) : null
}

export async function getDocsByUser(userId: string): Promise<Document[]> {
  const rows = await d1All<DocRow>(
    `SELECT v.*, u.name as user_name FROM verification_docs v JOIN users u ON u.id = v.user_id WHERE v.user_id = ? ORDER BY v.created_at DESC`,
    [userId]
  )
  return rows.map(mapDoc)
}

export async function getListingsByHost(hostId: string): Promise<Listing[]> {
  const rows = await d1All<ListingRow>(
    `SELECT l.*, lu.name as host FROM listings l JOIN users lu ON lu.id = l.landlord_id WHERE l.landlord_id = ? ORDER BY l.created_at DESC`,
    [hostId]
  )
  return rows.map(r => mapListing(r))
}

export async function getMessagesByUser(name: string): Promise<Message[]> {
  const rows = await d1All<MessageRow>(
    `${MESSAGE_SELECT} AND (su.name = ? OR lu.name = ?) ORDER BY m.created_at DESC`,
    [name, name]
  )
  return rows.map(mapMessage)
}

export async function getMessagesByListing(title: string): Promise<Message[]> {
  const rows = await d1All<MessageRow>(`${MESSAGE_SELECT} AND l.title = ? ORDER BY m.created_at DESC`, [title])
  return rows.map(mapMessage)
}

export async function getReports(opts: { filter?: string } = {}): Promise<Report[]> {
  const clauses: string[] = []
  const params: string[] = []
  if (opts.filter && opts.filter !== 'all') {
    clauses.push(`status = ?`)
    params.push(opts.filter)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = await d1All<ReportRow>(`SELECT * FROM reports ${where} ORDER BY created_at DESC`, params)
  return Promise.all(
    rows.map(async r => ({
      id: r.id,
      targetType: r.target_type as Report['targetType'],
      targetId: r.target_id,
      reason: r.reason,
      status: r.status as Report['status'],
      createdAt: relativeTime(r.created_at),
      resolvedAt: r.resolved_at ? relativeTime(r.resolved_at) : null,
      resolutionNote: r.resolution_note,
      summary: await reportSummary(r.target_type, r.target_id),
      targetHref: await reportHref(r.target_type, r.target_id),
    }))
  )
}

export async function getReport(id: string): Promise<Report | null> {
  const row = await d1First<ReportRow>(`SELECT * FROM reports WHERE id = ?`, [id])
  if (!row) return null
  return {
    id: row.id,
    targetType: row.target_type as Report['targetType'],
    targetId: row.target_id,
    reason: row.reason,
    status: row.status as Report['status'],
    createdAt: relativeTime(row.created_at),
    resolvedAt: row.resolved_at ? relativeTime(row.resolved_at) : null,
    resolutionNote: row.resolution_note,
    summary: await reportSummary(row.target_type, row.target_id),
    targetHref: await reportHref(row.target_type, row.target_id),
  }
}

export async function getReportsForTarget(targetType: string, targetId: string): Promise<Report[]> {
  const rows = await d1All<ReportRow>(`SELECT * FROM reports WHERE target_type = ? AND target_id = ?`, [
    targetType,
    targetId,
  ])
  return Promise.all(
    rows.map(async r => ({
      id: r.id,
      targetType: r.target_type as Report['targetType'],
      targetId: r.target_id,
      reason: r.reason,
      status: r.status as Report['status'],
      createdAt: relativeTime(r.created_at),
      resolvedAt: r.resolved_at ? relativeTime(r.resolved_at) : null,
      resolutionNote: r.resolution_note,
      summary: await reportSummary(r.target_type, r.target_id),
      targetHref: await reportHref(r.target_type, r.target_id),
    }))
  )
}

export async function getAppSettings(): Promise<AppSetting[]> {
  const DEFAULTS: Omit<AppSetting, 'enabled'>[] = [
    { key: 'signups_enabled', label: 'Allow new sign-ups', description: 'Kill switch for new account registration.' },
    { key: 'listing_submission_enabled', label: 'Allow new listing submissions', description: 'Pause "List Your Place" submissions during an incident.' },
    { key: 'maintenance_mode', label: 'Maintenance mode', description: 'Show a maintenance banner and block non-admin traffic.' },
  ]
  const rows = await d1All<{ key: string; value: string }>(`SELECT key, value FROM app_settings`)
  const stored = new Map(rows.map(r => [r.key, r.value]))
  return DEFAULTS.map(d => ({ ...d, enabled: stored.has(d.key) ? stored.get(d.key) === 'true' : true }))
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const rows = await d1All<{
    id: string
    admin_id: string
    action: string
    target_type: string
    target_id: string
    note: string | null
    created_at: number | null
  }>(`SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 200`)
  return rows.map(r => ({
    id: r.id,
    adminEmail: r.admin_id,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    note: r.note,
    createdAt: relativeTime(r.created_at),
  }))
}

// ─── Mutations (used by server actions) ───────────────────────────────────────

export async function _setUserStatus(
  id: string,
  status: User['status'],
  extra: { verificationNote?: string | null; banReason?: string | null; banExpiresAt?: string | null; bannedAt?: boolean; adminId?: string } = {}
) {
  const now = nowSeconds()
  if (status === 'banned') {
    await d1Run(
      `UPDATE users SET verification_status = ?, banned_at = ?, banned_by = ?, ban_reason = ?, ban_expires_at = ? WHERE id = ?`,
      [status, now, extra.adminId ?? null, extra.banReason ?? null, extra.banExpiresAt ? Math.floor(new Date(extra.banExpiresAt).getTime() / 1000) : null, id]
    )
    return
  }
  const verificationNote = status === 'rejected' ? extra.verificationNote ?? null : null
  await d1Run(
    `UPDATE users SET verification_status = ?, verification_note = ?, verified_at = ?, verified_by = ?,
       banned_at = NULL, banned_by = NULL, ban_reason = NULL, ban_expires_at = NULL WHERE id = ?`,
    [status, verificationNote, status === 'verified' ? now : null, status === 'verified' ? extra.adminId ?? null : null, id]
  )
}

export async function _setListingStatus(id: string, status: Listing['status'], rejectionReason: string | null = null) {
  const reason = status === 'rejected' || status === 'archived' ? rejectionReason : null
  await d1Run(`UPDATE listings SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?`, [
    status,
    reason,
    nowSeconds(),
    id,
  ])
}

export async function _setDocStatus(id: string, status: Document['status'], rejectionReason: string | null = null, adminId?: string) {
  await d1Run(
    `UPDATE verification_docs SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?`,
    [status, status === 'rejected' ? rejectionReason : null, adminId ?? null, nowSeconds(), id]
  )
}

export async function _redactMessage(id: string, adminId: string) {
  await d1Run(`UPDATE messages SET deleted_at = ?, deleted_by = ? WHERE id = ?`, [nowSeconds(), adminId, id])
}

// Admin sends into a conversation directly — as support, or standing in as
// the host on CASA listings. created_at is stored in ms to match the rest of
// the messages table, which is written in ms by the student/host app.
export async function _sendMessage(inquiryId: string, senderId: string, body: string) {
  await d1Run(
    `INSERT INTO messages (id, inquiry_id, sender_id, body, msg_type, created_at) VALUES (?, ?, ?, ?, 'text', ?)`,
    [crypto.randomUUID(), inquiryId, senderId, body, Date.now()]
  )
}

// Hard-deletes a user and everything that traces back to them: their listings
// (and those listings' photos/amenities), every conversation they're part of
// — including the other participant's copy of it, since messages are shared
// rows, not per-user copies — uploaded documents, and any reports pointing at
// any of the above. Deliberately a hard delete, not the soft-delete the
// original plan doc recommended (ADMIN_PANEL_PLAN.md §2) — this account has
// no history worth preserving once removed. Runs as a sequence of statements,
// not a single transaction (the D1 REST API here doesn't expose batching),
// ordered children-before-parents so it's still correct if partially applied.
export async function _deleteUserAccount(userId: string): Promise<void> {
  const [listingRows, docRows] = await Promise.all([
    d1All<{ id: string }>(`SELECT id FROM listings WHERE landlord_id = ?`, [userId]),
    d1All<{ r2_key: string | null }>(`SELECT r2_key FROM verification_docs WHERE user_id = ?`, [userId]),
  ])
  const listingIds = listingRows.map(l => l.id)

  const inquiryRows = await d1All<{ id: string }>(
    listingIds.length
      ? `SELECT id FROM inquiries WHERE student_id = ? OR listing_id IN (${inClause(listingIds.length)})`
      : `SELECT id FROM inquiries WHERE student_id = ?`,
    listingIds.length ? [userId, ...listingIds] : [userId]
  )
  const inquiryIds = inquiryRows.map(i => i.id)

  const messageRows = inquiryIds.length
    ? await d1All<{ id: string }>(`SELECT id FROM messages WHERE inquiry_id IN (${inClause(inquiryIds.length)})`, inquiryIds)
    : []
  const messageIds = messageRows.map(m => m.id)

  const photoRows = listingIds.length
    ? await d1All<{ r2_key: string | null }>(`SELECT r2_key FROM listing_photos WHERE listing_id IN (${inClause(listingIds.length)})`, listingIds)
    : []

  // Reports against anything we're about to remove.
  if (messageIds.length) {
    await d1Run(`DELETE FROM reports WHERE target_type = 'message' AND target_id IN (${inClause(messageIds.length)})`, messageIds)
  }
  if (inquiryIds.length) {
    await d1Run(`DELETE FROM reports WHERE target_type = 'inquiry' AND target_id IN (${inClause(inquiryIds.length)})`, inquiryIds)
  }
  if (listingIds.length) {
    await d1Run(`DELETE FROM reports WHERE target_type = 'listing' AND target_id IN (${inClause(listingIds.length)})`, listingIds)
  }
  await d1Run(`DELETE FROM reports WHERE target_type = 'user' AND target_id = ?`, [userId])

  // Conversations — both the messages and the inquiry rows they belong to.
  if (inquiryIds.length) {
    await d1Run(`DELETE FROM messages WHERE inquiry_id IN (${inClause(inquiryIds.length)})`, inquiryIds)
    await d1Run(`DELETE FROM inquiries WHERE id IN (${inClause(inquiryIds.length)})`, inquiryIds)
  }

  // Listings and their photos/amenities.
  if (listingIds.length) {
    await d1Run(`DELETE FROM listing_amenities WHERE listing_id IN (${inClause(listingIds.length)})`, listingIds)
    await d1Run(`DELETE FROM listing_photos WHERE listing_id IN (${inClause(listingIds.length)})`, listingIds)
    await d1Run(`DELETE FROM listings WHERE landlord_id = ?`, [userId])
  }

  await d1Run(`DELETE FROM verification_docs WHERE user_id = ?`, [userId])
  await d1Run(`DELETE FROM user_inbox_counts WHERE user_id = ?`, [userId])
  await d1Run(`DELETE FROM users WHERE id = ?`, [userId])

  // Best-effort storage cleanup — the DB rows are already gone either way.
  await Promise.all([
    ...photoRows.filter(p => p.r2_key).map(p => deletePhoto(p.r2_key as string)),
    ...docRows.filter(d => d.r2_key).map(d => deletePhoto(d.r2_key as string)),
  ])
}

export async function _setReportStatus(id: string, status: Report['status'], resolutionNote: string | null = null, adminId?: string) {
  await d1Run(
    `UPDATE reports SET status = ?, resolved_by = ?, resolved_at = ?, resolution_note = ? WHERE id = ?`,
    [status, adminId ?? null, nowSeconds(), resolutionNote, id]
  )
}

export async function _setAppSetting(key: string, enabled: boolean, adminId?: string) {
  await d1Run(
    `INSERT INTO app_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    [key, enabled ? 'true' : 'false', adminId ?? null, nowSeconds()]
  )
}

export async function _writeAudit(adminEmail: string, action: string, targetType: string, targetId: string, note?: string | null) {
  await d1Run(
    `INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [crypto.randomUUID(), adminEmail, action, targetType, targetId, note ?? null, nowSeconds()]
  )
}

// ─── CASA listings (admin-curated, published straight away, source = 'casa') ──

export interface CasaListingInput {
  ptype: string
  title: string
  street: string
  city: string
  postcode: string
  bedrooms: number
  bathrooms: number
  aptSize: number
  roomSize: number
  rent: number
  utilities: number
  deposit: number
  availFrom: string | null
  availTo: string | null
  openEnded: boolean
  minPeriod: number | null
  maxPeriod: number | null
  desc: string
  mateCount: number
  mateGender: string | null
  prefGender: string | null
  mateNotes: string | null
  amenities: string[]
  photos: { r2Key: string; position: number; isCover: boolean }[]
  id?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function createCasaListing(input: CasaListingInput): Promise<string> {
  const id = input.id && UUID_RE.test(input.id) ? input.id : crypto.randomUUID()
  const now = nowSeconds()

  // Idempotent against retries — same client-generated listingId (e.g. after a
  // transient error on a previous attempt) must not insert a duplicate row.
  const existing = await d1First<{ id: string }>(`SELECT id FROM listings WHERE id = ?`, [id])
  if (existing) return id

  await d1Run(
    `INSERT INTO listings (
      id, landlord_id, ptype, title,
      street, city, postcode,
      bedrooms, bathrooms, size_sqm, room_size_sqm,
      cold_rent, utilities, deposit,
      avail_from, avail_to, open_ended,
      min_period, max_period,
      description,
      mate_count, mate_gender, pref_gender, mate_notes,
      status, source, created_at, updated_at
    ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'casa', ?, ?)`,
    [
      id, input.ptype, input.title,
      input.street, input.city, input.postcode,
      input.bedrooms, input.bathrooms, input.aptSize, input.roomSize,
      input.rent, input.utilities, input.deposit,
      input.availFrom, input.availTo, input.openEnded ? 1 : 0,
      input.minPeriod, input.maxPeriod,
      input.desc,
      input.mateCount, input.mateGender, input.prefGender, input.mateNotes,
      now, now,
    ]
  )

  for (const amenity of input.amenities) {
    await d1Run(`INSERT OR IGNORE INTO listing_amenities (listing_id, amenity) VALUES (?, ?)`, [id, amenity])
  }

  for (const photo of input.photos) {
    await d1Run(
      `INSERT INTO listing_photos (id, listing_id, r2_key, position, is_cover) VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), id, photo.r2Key, photo.position, photo.isCover ? 1 : 0]
    )
  }

  return id
}
