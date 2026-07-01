'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { Message, Report } from '@/lib/types'
import { messageStatus } from '@/lib/utils'

interface MessageModalProps {
  message: Message
  report: Report | null
  onResolve?: (note: string) => Promise<void>
  onRedact: () => Promise<void>
}

export default function MessageModal({ message, report, onResolve, onRedact }: MessageModalProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [resolving, setResolving] = useState(false)
  const [note, setNote] = useState('')
  const deleted = !!message.deletedAt
  const ms = messageStatus(!!report, deleted)

  function close() {
    router.back()
  }

  return (
    <div
      onClick={close}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,26,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: 520, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px -10px rgba(20,18,26,.35)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1eef7', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 16 }}>{message.userA} ↔ {message.userB}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9a94a8' }}>{message.listing ?? '—'}</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 11px', borderRadius: 999, background: ms.bg, color: ms.color }}>{ms.label}</span>
          <button type="button" onClick={close} style={{ cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', color: '#9a94a8', border: 'none', background: 'transparent', flex: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 11, background: '#faf9fc' }}>
          <div style={{ maxWidth: '78%', alignSelf: 'flex-start' }}>
            <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: '16px 16px 16px 5px', padding: '10px 14px', fontSize: 13.5, lineHeight: 1.45, color: '#1c1530' }}>Hi! Is it still available?</div>
          </div>
          <div style={{ maxWidth: '78%', alignSelf: 'flex-end' }}>
            <div style={{ background: '#f4f2f9', borderRadius: '16px 16px 5px 16px', padding: '10px 14px', fontSize: 13.5, lineHeight: 1.45, color: '#1c1530', fontStyle: deleted ? 'italic' : 'normal' }}>{message.preview}</div>
          </div>
          {report && (
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: '#fdecec', border: '1px solid #f3c6c6', borderRadius: 12, padding: '11px 13px', marginTop: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#92201a' }}>Reported: {report.reason}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {report && resolving && (
          <div style={{ padding: '18px 24px 0' }}>
            <textarea
              autoFocus
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What action was taken?"
              rows={3}
              style={{ width: '100%', resize: 'vertical', border: '1.5px solid #ece8f3', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#1c1530' }}
            />
          </div>
        )}
        <div style={{ padding: '18px 24px', borderTop: '1px solid #f1eef7', display: 'flex', gap: 10 }}>
          {report ? (
            resolving ? (
              <>
                <button
                  type="button"
                  disabled={pending || !note.trim()}
                  onClick={() => startTransition(async () => { await onResolve?.(note.trim()); close() })}
                  style={{ flex: 1, height: 44, border: 'none', borderRadius: 12, background: 'linear-gradient(180deg,#7c3aed,#6d28d9)', color: '#fff', fontFamily: 'var(--font-bricolage)', fontSize: 14, fontWeight: 700, cursor: pending || !note.trim() ? 'default' : 'pointer', opacity: pending || !note.trim() ? 0.6 : 1 }}
                >
                  {pending ? '…' : 'Confirm resolve'}
                </button>
                <button type="button" onClick={() => setResolving(false)} style={{ flex: 1, height: 44, border: '1.5px solid #ece8f3', borderRadius: 12, background: '#fff', color: '#1c1530', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </>
            ) : (
              <>
                {!deleted && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(async () => { await onRedact() })}
                    style={{ flex: 1, height: 44, border: '1.5px solid #f3c6c6', borderRadius: 12, background: '#fff', color: '#b91c1c', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1 }}
                  >
                    {pending ? '…' : 'Redact message'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setResolving(true)}
                  style={{ flex: 1, height: 44, border: 'none', borderRadius: 12, background: 'linear-gradient(180deg,#7c3aed,#6d28d9)', color: '#fff', fontFamily: 'var(--font-bricolage)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Mark resolved
                </button>
              </>
            )
          ) : (
            <button type="button" onClick={close} style={{ flex: 1, height: 44, border: '1.5px solid #ece8f3', borderRadius: 12, background: '#fff', color: '#1c1530', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          )}
        </div>
      </div>
    </div>
  )
}
