import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/session'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const session = await getAdminSession()
  if (session) redirect('/')

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#faf9fc',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          borderRadius: 22,
          padding: '40px 36px',
          boxShadow: '0 30px 70px -20px rgba(34,18,68,.45), 0 2px 8px rgba(34,18,68,.08)',
          border: '1.5px solid #e6e2ef',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <span style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 20, color: '#2a1259', letterSpacing: '-.02em' }}>
            UniStay Admin
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-bricolage)',
            fontWeight: 800,
            fontSize: 26,
            color: '#1c1530',
            letterSpacing: '-.02em',
            margin: '0 0 6px',
          }}
        >
          Sign in
        </h1>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 15, color: '#6b6675', margin: '0 0 28px' }}>
          Admin access only. Contact an existing admin if you need an account.
        </p>

        <LoginForm />
      </div>
    </div>
  )
}
