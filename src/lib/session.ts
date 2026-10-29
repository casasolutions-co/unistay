import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { adminAuth } from './firebase-admin'

const SESSION_COOKIE = 'admin_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 5 // 5 days, matches Firebase session cookie max

function key() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export interface AdminSessionPayload {
  uid: string
  email: string
}

export async function createAdminSession(payload: AdminSessionPayload) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(key())

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  let session: AdminSessionPayload
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] })
    session = { uid: payload.uid as string, email: payload.email as string }
  } catch {
    return null
  }

  // The JWT alone is valid for its full 5-day TTL, decoupled from Firebase — so
  // re-check the live admin claim on every use. A revoked/disabled admin (or a
  // stolen cookie whose account was locked) then loses access immediately rather
  // than at cookie expiry. Fail *open* only on transient lookup errors so a
  // Firebase blip doesn't log every admin out; a definitive "not admin /
  // disabled" fails closed.
  // ponytail: getUser per call is fine at admin traffic; add a short in-memory
  // TTL cache keyed by uid if it ever shows up in latency.
  try {
    const u = await adminAuth.getUser(session.uid)
    if (u.disabled || u.customClaims?.admin !== true) return null
  } catch (err) {
    console.error('[getAdminSession] admin claim re-check failed (allowing session):', err)
  }

  return session
}

export async function deleteAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export { SESSION_COOKIE }
