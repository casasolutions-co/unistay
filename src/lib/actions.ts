'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  _setUserStatus, _setListingStatus, _setDocStatus, _redactMessage,
  _setReportStatus, _setAppSetting, _writeAudit, _deleteCasaListing, _sendMessage, _deleteUserAccount,
  _createFaq, _updateFaq, _deleteFaq, _moveFaq, _setTicketStatus, getThreadMeta,
} from './data'
import { deleteAdminSession, getAdminSession } from './session'
import { adminAuth } from './firebase-admin'
import type { FaqCategory } from './types'
import { sendEmail } from './email/send'
import { supportTicketReplyEmail, supportTicketResolvedEmail } from './email/templates'

async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) throw new Error('Not authenticated')
  return session
}

async function adminEmail(): Promise<string> {
  return (await requireAdmin()).email
}

async function adminUid(): Promise<string> {
  return (await requireAdmin()).uid
}

export async function logout() {
  await deleteAdminSession()
  redirect('/login')
}

// ─── Users ─────────────────────────────────────────────────────────────────

export async function verifyUser(id: string) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setUserStatus(id, 'verified', { adminId: uid })
  await _writeAudit(email, 'user.verify', 'user', id)
  revalidatePath('/users')
  revalidatePath('/')
}

export async function rejectUser(id: string, note: string) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setUserStatus(id, 'rejected', { verificationNote: note, adminId: uid })
  await _writeAudit(email, 'user.reject', 'user', id, note)
  revalidatePath('/users')
  revalidatePath('/')
}

export async function banUser(id: string, reason: string, expiresAt: string | null) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setUserStatus(id, 'banned', { banReason: reason, banExpiresAt: expiresAt, adminId: uid })
  // users.id is the Firebase uid (see src/app/api/auth/sync/route.ts in the student app) — revoke
  // so a still-valid ID token can't keep authenticating past this point.
  await adminAuth.revokeRefreshTokens(id)
  await _writeAudit(email, 'user.ban', 'user', id, `${reason}${expiresAt ? ` (until ${expiresAt})` : ' (permanent)'}`)
  revalidatePath('/users')
  revalidatePath('/')
}

export async function unbanUser(id: string) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setUserStatus(id, 'verified', { adminId: uid })
  await _writeAudit(email, 'user.unban', 'user', id)
  revalidatePath('/users')
  revalidatePath('/')
}

// Hard delete — removes the user, their listings, every conversation they're
// part of, uploaded documents, and reports against any of it. See
// _deleteUserAccount for exactly what's cascaded. Irreversible.
export async function deleteUser(id: string) {
  const email = await adminEmail()
  await _deleteUserAccount(id)
  await _writeAudit(email, 'user.delete', 'user', id)
  revalidatePath('/users')
  revalidatePath('/listings')
  revalidatePath('/messages')
  revalidatePath('/reports')
  revalidatePath('/documents')
  revalidatePath('/')
  redirect('/users')
}

// ─── Listings ──────────────────────────────────────────────────────────────

export async function approveListing(id: string) {
  const email = await adminEmail()
  await _setListingStatus(id, 'published')
  await _writeAudit(email, 'listing.approve', 'listing', id)
  revalidatePath('/listings')
  revalidatePath('/')
}

export async function rejectListing(id: string, reason: string) {
  const email = await adminEmail()
  await _setListingStatus(id, 'rejected', reason)
  await _writeAudit(email, 'listing.reject', 'listing', id, reason)
  revalidatePath('/listings')
  revalidatePath('/')
}

export async function archiveListing(id: string, reason: string) {
  const email = await adminEmail()
  await _setListingStatus(id, 'archived', reason)
  await _writeAudit(email, 'listing.archive', 'listing', id, reason)
  revalidatePath('/listings')
  revalidatePath('/')
}

export async function deleteCasaListing(id: string) {
  const email = await adminEmail()
  await _deleteCasaListing(id)
  await _writeAudit(email, 'listing.casa_delete', 'listing', id)
  revalidatePath('/listings')
  revalidatePath('/')
}

export async function restoreListing(id: string, wasPublished: boolean) {
  const email = await adminEmail()
  await _setListingStatus(id, wasPublished ? 'published' : 'pending_review')
  await _writeAudit(email, 'listing.restore', 'listing', id)
  revalidatePath('/listings')
  revalidatePath('/')
}

// ─── Documents ─────────────────────────────────────────────────────────────

export async function approveDoc(id: string) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setDocStatus(id, 'approved', null, uid)
  await _writeAudit(email, 'doc.approve', 'verification_doc', id)
  revalidatePath('/documents')
}

export async function rejectDoc(id: string, reason: string) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setDocStatus(id, 'rejected', reason, uid)
  await _writeAudit(email, 'doc.reject', 'verification_doc', id, reason)
  revalidatePath('/documents')
}

// ─── Reports / messages ────────────────────────────────────────────────────

export async function resolveReport(id: string, note: string) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setReportStatus(id, 'resolved', note, uid)
  await _writeAudit(email, 'report.resolve', 'report', id, note)
  revalidatePath('/reports')
  revalidatePath('/messages')
  revalidatePath('/')
}

export async function dismissReport(id: string, note: string) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setReportStatus(id, 'dismissed', note, uid)
  await _writeAudit(email, 'report.dismiss', 'report', id, note)
  revalidatePath('/reports')
  revalidatePath('/messages')
  revalidatePath('/')
}

export async function redactMessage(id: string) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _redactMessage(id, uid ?? email)
  await _writeAudit(email, 'message.redact', 'message', id)
  revalidatePath('/messages')
  revalidatePath('/reports')
}

export async function sendMessage(inquiryId: string, formData: FormData) {
  const body = String(formData.get('body') ?? '').trim()
  if (!body) return
  const email = await adminEmail()
  const uid = await adminUid()
  await _sendMessage(inquiryId, uid ?? email, body)
  await _writeAudit(email, 'message.send', 'inquiry', inquiryId, body)
  revalidatePath('/messages')

  // Best-effort — the message is already sent and persisted above, so a failure
  // here (thread lookup or the email provider) must never surface as a failed
  // action and risk the admin retrying/duplicating the reply.
  try {
    const thread = await getThreadMeta(inquiryId)
    if (thread?.type === 'support' && thread.studentEmail) {
      await sendEmail(thread.studentEmail, supportTicketReplyEmail({
        name: thread.studentName,
        ticketNo: thread.ticketNo ?? 0,
        subject: thread.subject ?? '',
      }))
    }
  } catch (err) {
    console.error('Failed to send ticket reply email', err)
  }
}

export async function setTicketStatus(inquiryId: string, status: 'open' | 'resolved') {
  const email = await adminEmail()
  const thread = await getThreadMeta(inquiryId)
  if (!thread || thread.type !== 'support') throw new Error('Not a support ticket')
  await _setTicketStatus(inquiryId, status)
  await _writeAudit(email, status === 'resolved' ? 'ticket.resolve' : 'ticket.reopen', 'inquiry', inquiryId)
  revalidatePath('/messages')

  if (status === 'resolved' && thread.studentEmail) {
    await sendEmail(thread.studentEmail, supportTicketResolvedEmail({
      name: thread.studentName,
      ticketNo: thread.ticketNo ?? 0,
      subject: thread.subject ?? '',
    })).catch(err => console.error('Failed to send ticket resolved email', err))
  }
}

// ─── Settings ──────────────────────────────────────────────────────────────

export async function toggleAppSetting(key: string, enabled: boolean) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setAppSetting(key, enabled, uid)
  await _writeAudit(email, 'setting.update', 'setting', key, enabled ? 'enabled' : 'disabled')
  revalidatePath('/settings')
}

// ─── FAQs ──────────────────────────────────────────────────────────────────

export async function createFaq(category: FaqCategory, question: string, answer: string, published: boolean) {
  const email = await adminEmail()
  const id = await _createFaq(category, question, answer, published)
  await _writeAudit(email, 'faq.create', 'faq', id, question)
  revalidatePath('/faqs')
}

export async function updateFaq(id: string, fields: { question?: string; answer?: string }) {
  const email = await adminEmail()
  await _updateFaq(id, fields)
  await _writeAudit(email, 'faq.update', 'faq', id)
  revalidatePath('/faqs')
}

export async function toggleFaqPublished(id: string, published: boolean) {
  const email = await adminEmail()
  await _updateFaq(id, { published })
  await _writeAudit(email, 'faq.update', 'faq', id, published ? 'published' : 'unpublished')
  revalidatePath('/faqs')
}

export async function deleteFaq(id: string) {
  const email = await adminEmail()
  await _deleteFaq(id)
  await _writeAudit(email, 'faq.delete', 'faq', id)
  revalidatePath('/faqs')
}

export async function moveFaq(id: string, direction: 'up' | 'down') {
  const email = await adminEmail()
  await _moveFaq(id, direction)
  await _writeAudit(email, 'faq.reorder', 'faq', id, direction)
  revalidatePath('/faqs')
}
