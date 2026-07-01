'use client'

import { useTransition } from 'react'

interface ActionBtnProps {
  action: () => Promise<void>
  label: string
  variant?: 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

const variants = {
  primary: { border: 'none', background: 'linear-gradient(180deg,#7c3aed,#6d28d9)', color: '#fff' },
  danger:  { border: '1px solid #f3c6c6', background: '#fff', color: '#b91c1c' },
  ghost:   { border: '1px solid #ece8f3', background: '#fff', color: '#4a4654' },
}

export default function ActionBtn({ action, label, variant = 'primary', size = 'sm' }: ActionBtnProps) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => action())}
      style={{
        height: size === 'sm' ? 32 : 42,
        padding: size === 'sm' ? '0 13px' : '0 18px',
        borderRadius: size === 'sm' ? 9 : 11,
        fontFamily: 'inherit',
        fontSize: size === 'sm' ? 12.5 : 13.5,
        fontWeight: 700,
        cursor: pending ? 'default' : 'pointer',
        opacity: pending ? 0.6 : 1,
        transition: 'opacity .15s',
        ...variants[variant],
      }}
    >
      {pending ? '…' : label}
    </button>
  )
}

interface TriggerBtnProps {
  onClick: () => void
  label: string
  variant?: 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

export function TriggerBtn({ onClick, label, variant = 'primary', size = 'sm' }: TriggerBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: size === 'sm' ? 32 : 42,
        padding: size === 'sm' ? '0 13px' : '0 18px',
        borderRadius: size === 'sm' ? 9 : 11,
        fontFamily: 'inherit',
        fontSize: size === 'sm' ? 12.5 : 13.5,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'opacity .15s',
        ...variants[variant],
      }}
    >
      {label}
    </button>
  )
}
