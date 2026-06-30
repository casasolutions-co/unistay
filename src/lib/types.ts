export type UserStatus = 'unverified' | 'verified' | 'kicked'
export type ListingStatus = 'pending' | 'approved' | 'removed'
export type DocStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  university: string
  joined: string
  status: UserStatus
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
  thumb: number
}

export interface Message {
  id: string
  userA: string
  userB: string
  listing: string | null
  preview: string
  time: string
  flagged: boolean
}

export interface Document {
  id: string
  userId: string
  user: string
  type: string
  uploaded: string
  status: DocStatus
}

export interface DashboardCounts {
  users: number
  listings: number
  messages: number
  documents: number
}
