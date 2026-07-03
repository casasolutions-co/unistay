export type UserStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'banned'
export type ListingStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
export type DocStatus = 'pending' | 'approved' | 'rejected'
export type ReportStatus = 'open' | 'resolved' | 'dismissed'
export type ReportTargetType = 'user' | 'listing' | 'message' | 'inquiry'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  university: string
  joined: string
  status: UserStatus
  verificationNote?: string | null
  bannedAt?: string | null
  banReason?: string | null
  banExpiresAt?: string | null // null + banned = permanent
}

export interface Listing {
  id: string
  title: string
  hostId: string
  host: string
  location: string
  price: string
  submitted: string
  status: ListingStatus
  rejectionReason?: string | null
  thumb: number
  description?: string | null
  ptype?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  sizeSqm?: number | null
  coldRent?: number | null
  utilities?: number | null
  deposit?: number | null
  amenities?: string[]
  photoKeys?: string[]
  source?: 'private' | 'casa'
}

export interface Message {
  id: string
  inquiryId: string
  userA: string
  userB: string
  listing: string | null
  preview: string
  time: string
  deletedAt?: string | null
}

export interface MessageThread {
  inquiryId: string
  listingId: string
  listingTitle: string | null
  listingCity: string | null
  coldRent: number | null
  studentId: string
  studentName: string
  landlordId: string | null
  landlordName: string
  lastBody?: string | null
  lastAt?: string
  reported?: boolean
}

export interface ThreadMessage {
  id: string
  senderId: string
  senderRole: 'student' | 'landlord' | 'admin'
  body: string
  msgType: string
  metadata: string | null
  createdAtMs: number | null
  readAtMs: number | null
  deletedAt: string | null
  reportId: string | null
  reportReason: string | null
}

export interface Document {
  id: string
  userId: string
  user: string
  type: string
  uploaded: string
  status: DocStatus
  rejectionReason?: string | null
}

export interface Report {
  id: string
  targetType: ReportTargetType
  targetId: string
  reason: string
  status: ReportStatus
  createdAt: string
  resolvedAt?: string | null
  resolutionNote?: string | null
  // denormalized display fields for the mock layer
  summary: string
  targetHref: string
}

export interface AppSetting {
  key: string
  label: string
  description: string
  enabled: boolean
}

export interface AuditLogEntry {
  id: string
  adminEmail: string
  action: string
  targetType: string
  targetId: string
  note?: string | null
  createdAt: string
}

export interface DashboardCounts {
  users: number
  listings: number
  messages: number
  documents: number
  reports: number
}
