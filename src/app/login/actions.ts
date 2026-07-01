'use server'

import { redirect } from 'next/navigation'
import { adminAuth } from '@/lib/firebase-admin'
import { createAdminSession } from '@/lib/session'

export interface LoginState {
  error?: string
}

export async function login(_prevState: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Enter your email and password.' }
  }

  const apiKey = process.env.FIREBASE_API_KEY
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )

  if (!res.ok) {
    return { error: 'Invalid email or password.' }
  }

  const { idToken } = (await res.json()) as { idToken: string }

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(idToken)
  } catch {
    return { error: 'Could not verify credentials. Try again.' }
  }

  if (decoded.admin !== true) {
    return { error: 'This account does not have admin access.' }
  }

  await createAdminSession({ uid: decoded.uid, email: decoded.email ?? email })
  redirect('/')
}
