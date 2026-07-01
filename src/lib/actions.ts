'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  _setUserStatus, _setListingStatus, _setDocStatus, _redactMessage,
  _setReportStatus, _setAppSetting, _writeAudit, _deleteCasaListing,
} from './data'
import { deleteAdminSession, getAdminSession } from './session'

async function adminEmail(): Promise<string> {
  const session = await getAdminSession()
  return session?.email ?? 'unknown-admin'
}

async function adminUid(): Promise<string | undefined> {
  const session = await getAdminSession()
  return session?.uid
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
  try {
    await _writeAudit(email, 'listing.casa_delete', 'listing', id)
  } catch { /* best-effort — see /api/casa-listings for why this can fail */ }
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

// ─── Settings ──────────────────────────────────────────────────────────────

export async function toggleAppSetting(key: string, enabled: boolean) {
  const email = await adminEmail()
  const uid = await adminUid()
  await _setAppSetting(key, enabled, uid)
  await _writeAudit(email, 'setting.update', 'setting', key, enabled ? 'enabled' : 'disabled')
  revalidatePath('/settings')
}
