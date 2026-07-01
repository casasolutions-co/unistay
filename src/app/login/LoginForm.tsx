'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-manrope)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#8a8499',
  marginBottom: 6,
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 52,
  padding: '0 16px',
  border: '1.5px solid #e6e2ef',
  borderRadius: 14,
  background: '#faf9fc',
  font: '600 15px var(--font-manrope)',
  color: '#1c1530',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(login, undefined)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label htmlFor="email" style={labelStyle}>Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required style={inputStyle} placeholder="you@unistay.com" />
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required style={inputStyle} placeholder="••••••••" />
      </div>

      {state?.error && (
        <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 600, color: '#c0392b' }}>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          height: 54,
          border: 'none',
          borderRadius: 14,
          background: 'linear-gradient(180deg, #7c3aed 0%, #6d28d9 100%)',
          color: '#fff',
          fontFamily: 'var(--font-bricolage)',
          fontWeight: 700,
          fontSize: 16,
          cursor: pending ? 'default' : 'pointer',
          opacity: pending ? 0.7 : 1,
          boxShadow: '0 10px 22px -6px rgba(109,40,217,.55), inset 0 1px 0 rgba(255,255,255,.22)',
        }}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
