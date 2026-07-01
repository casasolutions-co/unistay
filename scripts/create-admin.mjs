import pkg from '@next/env'
const { loadEnvConfig } = pkg
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

loadEnvConfig(process.cwd())

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })

const auth = getAuth(app)

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>')
  process.exit(1)
}

let user
try {
  user = await auth.getUserByEmail(email)
  console.log(`User already exists (uid: ${user.uid}), updating password...`)
  await auth.updateUser(user.uid, { password })
} catch {
  user = await auth.createUser({ email, password, emailVerified: true })
  console.log(`Created user (uid: ${user.uid})`)
}

await auth.setCustomUserClaims(user.uid, { admin: true })
console.log(`Set admin:true claim on ${email}`)
