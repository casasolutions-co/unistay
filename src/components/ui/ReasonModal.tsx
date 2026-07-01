'use client'

import { useState, useTransition } from 'react'

interface ReasonModalProps {
  trigger: (open: () => void) => React.ReactNode
  title: string
  description?: string
  confirmLabel: string
  placeholder?: string
  danger?: boolean
  showDuration?: boolean
  onSubmit: (reason: string, expiresAt: string | null) => Promise<void>
}

export default function ReasonModal({
  trigger, title, description, confirmLabel, placeholder = 'Reason…',
  danger = true, showDuration = false, onSubmit,
}: ReasonModalProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [duration, setDuration] = useState('permanent')
  const [pending, startTransition] = useTransition()

  function close() {
    setOpen(false)
    setReason('')
    setDuration('permanent')
  }

  function submit() {
    if (!reason.trim()) return
    let expiresAt: string | null = null
    if (showDuration && duration !== 'permanent') {
      expiresAt = duration
    }
    startTransition(async () => {
      await onSubmit(reason.trim(), expiresAt)
      close()
    })
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,26,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 440, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px -10px rgba(20,18,26,.35)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1eef7' }}>
              <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 16 }}>{title}</div>
              {description && <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9a94a8', marginTop: 4 }}>{description}</div>}
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea
                autoFocus
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={placeholder}
                rows={3}
                style={{ width: '100%', resize: 'vertical', border: '1.5px solid #ece8f3', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#1c1530' }}
              />
              {showDuration && (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 6 }}>DURATION</div>
                  <select
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #ece8f3', borderRadius: 10, padding: '9px 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#1c1530' }}
                  >
                    <option value="permanent">Permanent</option>
                    <option value="7 days">7 days</option>
                    <option value="30 days">30 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ padding: '0 24px 22px', display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={pending || !reason.trim()}
                onClick={submit}
                style={{
                  flex: 1, height: 44, border: 'none', borderRadius: 12,
                  background: danger ? '#b91c1c' : 'linear-gradient(180deg,#7c3aed,#6d28d9)',
                  color: '#fff', fontFamily: 'var(--font-bricolage)', fontSize: 14, fontWeight: 700,
                  cursor: pending || !reason.trim() ? 'default' : 'pointer', opacity: pending || !reason.trim() ? 0.6 : 1,
                }}
              >
                {pending ? '…' : confirmLabel}
              </button>
              <button type="button" onClick={close} style={{ flex: 1, height: 44, border: '1.5px solid #ece8f3', borderRadius: 12, background: '#fff', color: '#1c1530', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
