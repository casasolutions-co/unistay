import type { UserStatus, ListingStatus, DocStatus } from './types'

const AVATAR_COLORS = [
  'linear-gradient(135deg,#7c3aed,#4a1d95)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#27ae73,#1f8a5b)',
  'linear-gradient(135deg,#475569,#1e293b)',
  'linear-gradient(135deg,#f5a623,#d97706)',
  'linear-gradient(135deg,#14b8a6,#0f766e)',
]

export const THUMBS = [
  'repeating-linear-gradient(135deg,#c4b5fd 0 8px,#a78bfa 8px 16px)',
  'repeating-linear-gradient(135deg,#a7f3d0 0 8px,#6ee7b7 8px 16px)',
  'repeating-linear-gradient(135deg,#fde68a 0 8px,#fcd34d 8px 16px)',
]

export function avatarBg(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function thumbBg(index: number): string {
  return THUMBS[index % THUMBS.length]
}

export function userStatus(status: UserStatus) {
  const map: Record<UserStatus, { label: string; bg: string; color: string }> = {
    unverified: { label: 'Unverified', bg: '#f4f2f9', color: '#6b6675' },
    pending:    { label: 'Pending review', bg: '#fff3d6', color: '#92660b' },
    verified:   { label: 'Verified',   bg: '#eafaf2', color: '#1f8a5b' },
    rejected:   { label: 'Rejected',   bg: '#fdecec', color: '#b91c1c' },
    banned:     { label: 'Banned',     bg: '#fdecec', color: '#b91c1c' },
  }
  return map[status]
}

export function listingStatus(status: ListingStatus) {
  const map: Record<ListingStatus, { label: string; bg: string; color: string }> = {
    draft:           { label: 'Draft',          bg: '#f4f2f9', color: '#6b6675' },
    pending_review:  { label: 'Pending review', bg: '#fff3d6', color: '#92660b' },
    published:       { label: 'Published',      bg: '#eafaf2', color: '#1f8a5b' },
    rejected:        { label: 'Rejected',       bg: '#fdecec', color: '#b91c1c' },
    archived:        { label: 'Archived',       bg: '#fdecec', color: '#b91c1c' },
  }
  return map[status]
}

export function docStatus(status: DocStatus) {
  const map: Record<DocStatus, { label: string; bg: string; color: string }> = {
    pending:  { label: 'Pending review', bg: '#fff3d6', color: '#92660b' },
    approved: { label: 'Approved',       bg: '#eafaf2', color: '#1f8a5b' },
    rejected: { label: 'Rejected',       bg: '#fdecec', color: '#b91c1c' },
  }
  return map[status]
}

export function messageStatus(reported: boolean, deleted: boolean = false) {
  if (deleted) return { label: 'Redacted', bg: '#f4f2f9', color: '#6b6675' }
  return reported
    ? { label: 'Reported', bg: '#fdecec', color: '#b91c1c' }
    : { label: 'Clear',    bg: '#f4f2f9', color: '#6b6675' }
}

export function reportStatus(status: 'open' | 'resolved' | 'dismissed') {
  const map = {
    open:      { label: 'Open',      bg: '#fff3d6', color: '#92660b' },
    resolved:  { label: 'Resolved',  bg: '#eafaf2', color: '#1f8a5b' },
    dismissed: { label: 'Dismissed', bg: '#f4f2f9', color: '#6b6675' },
  }
  return map[status]
}

export function faqStatus(published: boolean) {
  return published
    ? { label: 'Published', bg: '#eafaf2', color: '#1f8a5b' }
    : { label: 'Draft',     bg: '#f4f2f9', color: '#6b6675' }
}
