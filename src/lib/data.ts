import type { User, Listing, Message, Document, DashboardCounts } from './types'

// ─── In-memory store (swap each function body for a real DB call later) ───────

const users: User[] = [
  { id: 'u1', name: 'Sarah Madsen',  email: 'sarah.madsen@tum.de',    joined: '2 days ago',   status: 'unverified', university: 'TU Munich',  phone: '+49 151 2233 4455' },
  { id: 'u2', name: 'James Okafor',  email: 'j.okafor@lmu.de',        joined: '1 week ago',   status: 'verified',   university: 'LMU Munich', phone: '+49 160 1122 3344' },
  { id: 'u3', name: 'Priya Kapoor',  email: 'priya.k@tum.de',         joined: '3 days ago',   status: 'unverified', university: 'TU Munich',  phone: '+49 176 5566 7788' },
  { id: 'u4', name: 'Marco Diaz',    email: 'marco.diaz@gmail.com',   joined: '2 months ago', status: 'kicked',     university: '—',          phone: '+49 152 9988 7766' },
  { id: 'u5', name: 'Lena Fischer',  email: 'lena.fischer@hm.edu',    joined: '5 months ago', status: 'verified',   university: 'HM Munich',  phone: '+49 171 3344 5566' },
  { id: 'u6', name: 'Jonas Weber',   email: 'jonas.weber@tum.de',     joined: '1 month ago',  status: 'verified',   university: 'TU Munich',  phone: '+49 160 7788 9900' },
  { id: 'u7', name: 'Mira Sahin',    email: 'mira.sahin@lmu.de',      joined: '4 days ago',   status: 'unverified', university: 'LMU Munich', phone: '+49 157 2244 6688' },
  { id: 'u8', name: 'Noah Becker',   email: 'noah.becker@tum.de',     joined: '6 days ago',   status: 'unverified', university: 'TU Munich',  phone: '+49 162 3399 1144' },
  { id: 'u9', name: 'Elif Yildiz',   email: 'elif.yildiz@hm.edu',     joined: '3 months ago', status: 'verified',   university: 'HM Munich',  phone: '+49 151 8800 2211' },
]

const listings: Listing[] = [
  { id: 'l1', title: 'Studio near TUM campus',       hostId: 'u5', host: 'Lena Fischer',  location: 'Maxvorstadt', price: '€950/mo',   submitted: '2 days ago',  status: 'pending',  thumb: 0 },
  { id: 'l2', title: '2-Bed Flat, Schwabing',         hostId: 'u6', host: 'Jonas Weber',   location: 'Schwabing',   price: '€1,800/mo', submitted: '5 days ago',  status: 'approved', thumb: 1 },
  { id: 'l3', title: 'Room in shared flat, Maxvorstadt', hostId: 'u9', host: 'Elif Yildiz', location: 'Maxvorstadt', price: '€620/mo',  submitted: '1 day ago',   status: 'pending',  thumb: 2 },
  { id: 'l4', title: '3-Room Apartment, Sendling',    hostId: 'u2', host: 'James Okafor',  location: 'Sendling',    price: '€1,450/mo', submitted: '1 week ago',  status: 'approved', thumb: 0 },
  { id: 'l5', title: 'Studio, Haidhausen',            hostId: 'u4', host: 'Marco Diaz',    location: 'Haidhausen',  price: '€880/mo',   submitted: '3 weeks ago', status: 'removed',  thumb: 1 },
  { id: 'l6', title: 'Loft, Glockenbachviertel',      hostId: 'u5', host: 'Lena Fischer',  location: 'Glockenbach', price: '€1,250/mo', submitted: '3 days ago',  status: 'pending',  thumb: 2 },
  { id: 'l7', title: 'Room near LMU, Giesing',        hostId: 'u9', host: 'Elif Yildiz',   location: 'Giesing',     price: '€700/mo',   submitted: '2 weeks ago', status: 'approved', thumb: 0 },
]

const messages: Message[] = [
  { id: 'm1', userA: 'Sarah Madsen', userB: 'Casa Rentals',   listing: 'Studio near TUM campus',    preview: 'Hi! Is it still available from Oct 1st?',                         time: '2h ago',  flagged: false },
  { id: 'm2', userA: 'Priya Kapoor', userB: 'Jonas Weber',    listing: '2-Bed Flat, Schwabing',      preview: 'Can we skip the deposit and pay you directly via bank transfer?', time: '5h ago',  flagged: true  },
  { id: 'm3', userA: 'Mira Sahin',   userB: 'Max Köhler',     listing: null,                         preview: 'Want to view the Haidhausen flat together?',                     time: '1d ago',  flagged: false },
  { id: 'm4', userA: 'Noah Becker',  userB: 'Elif Yildiz',    listing: 'Room near LMU, Giesing',    preview: "Forget the platform, here's my WhatsApp, let's deal directly.",   time: '1d ago',  flagged: true  },
  { id: 'm5', userA: 'James Okafor', userB: 'UniStay Support', listing: null,                        preview: 'My deposit refund is taking long, any update?',                   time: '2d ago',  flagged: false },
  { id: 'm6', userA: 'Lena Fischer', userB: 'Marco Diaz',     listing: 'Loft, Glockenbachviertel',  preview: 'Sounds good — see you at the viewing!',                           time: '4d ago',  flagged: false },
]

const documents: Document[] = [
  { id: 'd1', userId: 'u1', user: 'Sarah Madsen', type: 'ID card (front)',     uploaded: '2 days ago', status: 'pending'  },
  { id: 'd2', userId: 'u1', user: 'Sarah Madsen', type: 'Proof of enrolment', uploaded: '2 days ago', status: 'pending'  },
  { id: 'd3', userId: 'u3', user: 'Priya Kapoor', type: 'ID card (front)',     uploaded: '3 days ago', status: 'pending'  },
  { id: 'd4', userId: 'u3', user: 'Priya Kapoor', type: 'Passport',            uploaded: '3 days ago', status: 'approved' },
  { id: 'd5', userId: 'u3', user: 'Priya Kapoor', type: 'Proof of enrolment', uploaded: '3 days ago', status: 'pending'  },
  { id: 'd6', userId: 'u7', user: 'Mira Sahin',   type: 'ID card (front)',     uploaded: '4 days ago', status: 'rejected' },
  { id: 'd7', userId: 'u8', user: 'Noah Becker',  type: 'ID card (front)',     uploaded: '6 days ago', status: 'approved' },
  { id: 'd8', userId: 'u8', user: 'Noah Becker',  type: 'Proof of enrolment', uploaded: '6 days ago', status: 'approved' },
]

// ─── Query functions ───────────────────────────────────────────────────────────

export async function getDashboardCounts(): Promise<DashboardCounts> {
  return {
    users:     users.filter(u => u.status === 'unverified').length,
    listings:  listings.filter(l => l.status === 'pending').length,
    messages:  messages.filter(m => m.flagged).length,
    documents: documents.filter(d => d.status === 'pending').length,
  }
}

export async function getAttentionUsers(): Promise<User[]> {
  return users.filter(u => u.status === 'unverified').slice(0, 4)
}

export async function getAttentionListings(): Promise<Listing[]> {
  return listings.filter(l => l.status === 'pending').slice(0, 4)
}

export async function getUsers(opts: { filter?: string; q?: string } = {}): Promise<User[]> {
  let result = [...users]
  if (opts.filter && opts.filter !== 'all') {
    result = result.filter(u => u.status === opts.filter)
  }
  if (opts.q) {
    const q = opts.q.toLowerCase()
    result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }
  return result
}

export async function getUser(id: string): Promise<User | null> {
  return users.find(u => u.id === id) ?? null
}

export async function getListings(opts: { filter?: string; q?: string } = {}): Promise<Listing[]> {
  let result = [...listings]
  if (opts.filter && opts.filter !== 'all') {
    result = result.filter(l => l.status === opts.filter)
  }
  if (opts.q) {
    const q = opts.q.toLowerCase()
    result = result.filter(l => l.title.toLowerCase().includes(q) || l.host.toLowerCase().includes(q))
  }
  return result
}

export async function getListing(id: string): Promise<Listing | null> {
  return listings.find(l => l.id === id) ?? null
}

export async function getMessages(opts: { filter?: string } = {}): Promise<Message[]> {
  let result = [...messages]
  if (opts.filter === 'flagged') result = result.filter(m => m.flagged)
  return result
}

export async function getMessage(id: string): Promise<Message | null> {
  return messages.find(m => m.id === id) ?? null
}

export async function getDocuments(opts: { filter?: string } = {}): Promise<Document[]> {
  let result = [...documents]
  if (opts.filter && opts.filter !== 'all') {
    result = result.filter(d => d.status === opts.filter)
  }
  return result
}

export async function getDocument(id: string): Promise<Document | null> {
  return documents.find(d => d.id === id) ?? null
}

export async function getDocsByUser(userId: string): Promise<Document[]> {
  return documents.filter(d => d.userId === userId)
}

export async function getListingsByHost(hostId: string): Promise<Listing[]> {
  return listings.filter(l => l.hostId === hostId)
}

export async function getMessagesByUser(name: string): Promise<Message[]> {
  return messages.filter(m => m.userA === name || m.userB === name)
}

export async function getMessagesByListing(title: string): Promise<Message[]> {
  return messages.filter(m => m.listing === title)
}

// ─── Mutable store helpers (used by server actions) ───────────────────────────

export function _setUserStatus(id: string, status: User['status']) {
  const u = users.find(u => u.id === id)
  if (u) u.status = status
}

export function _setListingStatus(id: string, status: Listing['status']) {
  const l = listings.find(l => l.id === id)
  if (l) l.status = status
}

export function _setDocStatus(id: string, status: Document['status']) {
  const d = documents.find(d => d.id === id)
  if (d) d.status = status
}

export function _setMessageFlag(id: string, flagged: boolean) {
  const m = messages.find(m => m.id === id)
  if (m) m.flagged = flagged
}
