'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useState } from 'react'
import type { Document } from '@/lib/types'
import { docStatus } from '@/lib/utils'

interface DocModalProps {
  document: Document
  onApprove: () => Promise<void>
  onReject: (reason: string) => Promise<void>
}

export default function DocModal({ document, onApprove, onReject }: DocModalProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const ds = docStatus(document.status)

  function close() {
    router.back()
  }

  return (
    <div
      onClick={close}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,26,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: 460, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px -10px rgba(20,18,26,.35)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1eef7', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 16 }}>{document.type}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9a94a8' }}>{document.user} · uploaded {document.uploaded}</div>
          </div>
          <button type="button" onClick={close} style={{ cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', color: '#9a94a8', border: 'none', background: 'transparent', flex: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Preview */}
        <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
          {document.r2Key ? (
            <a href={`/api/admin-photo?key=${encodeURIComponent(document.r2Key)}`} target="_blank" rel="noopener noreferrer" style={{ width: 260, height: 320, borderRadius: 14, overflow: 'hidden', display: 'block', background: '#eee' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/admin-photo?key=${encodeURIComponent(document.r2Key)}`} alt={document.type} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </a>
          ) : (
            <div style={{ width: 260, height: 320, border: '1.5px dashed #ddd0f6', borderRadius: 14, background: 'repeating-linear-gradient(135deg,#f3effe 0 10px,#ede4fd 10px 20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#4a1d95' }}>No file uploaded</span>
            </div>
          )}
        </div>
        <div style={{ margin: '-14px 24px 16px', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: ds.bg, color: ds.color }}>{ds.label}</span>
        </div>

        {document.status === 'rejected' && document.rejectionReason && (
          <div style={{ margin: '0 24px 16px', fontSize: 12.5, fontWeight: 600, color: '#b91c1c', background: '#fdecec', borderRadius: 10, padding: '9px 12px' }}>
            Reason: {document.rejectionReason}
          </div>
        )}

        {/* Footer */}
        {document.status === 'pending' && rejecting && (
          <div style={{ padding: '0 24px 14px' }}>
            <textarea
              autoFocus
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for rejection…"
              rows={3}
              style={{ width: '100%', resize: 'vertical', border: '1.5px solid #ece8f3', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#1c1530' }}
            />
          </div>
        )}
        <div style={{ padding: '0 24px 22px', display: 'flex', gap: 10 }}>
          {document.status === 'pending' ? (
            rejecting ? (
              <>
                <button
                  type="button"
                  disabled={pending || !reason.trim()}
                  onClick={() => startTransition(async () => { await onReject(reason.trim()); close() })}
                  style={{ flex: 1, height: 44, border: 'none', borderRadius: 12, background: '#b91c1c', color: '#fff', fontFamily: 'var(--font-bricolage)', fontSize: 14, fontWeight: 700, cursor: pending || !reason.trim() ? 'default' : 'pointer', opacity: pending || !reason.trim() ? 0.6 : 1 }}
                >
                  {pending ? '…' : 'Confirm rejection'}
                </button>
                <button type="button" onClick={() => setRejecting(false)} style={{ flex: 1, height: 44, border: '1.5px solid #ece8f3', borderRadius: 12, background: '#fff', color: '#1c1530', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(async () => { await onApprove(); close() })}
                  style={{ flex: 1, height: 44, border: 'none', borderRadius: 12, background: 'linear-gradient(180deg,#7c3aed,#6d28d9)', color: '#fff', fontFamily: 'var(--font-bricolage)', fontSize: 14, fontWeight: 700, cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1 }}
                >
                  {pending ? '…' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setRejecting(true)}
                  style={{ flex: 1, height: 44, border: '1.5px solid #f3c6c6', borderRadius: 12, background: '#fff', color: '#b91c1c', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1 }}
                >
                  Reject
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
