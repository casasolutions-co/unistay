'use client'

import { useState } from 'react'

interface DeleteAccountModalProps {
  userName: string
  userEmail: string
  hasListings: boolean
  action: (formData: FormData) => Promise<void>
}

export default function DeleteAccountModal({ userName, userEmail, hasListings, action }: DeleteAccountModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const canDelete = confirmText.trim().toLowerCase() === userEmail.toLowerCase()

  function close() {
    setOpen(false)
    setConfirmText('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ height: 42, padding: '0 18px', borderRadius: 11, border: '1.5px solid #f3c6c6', background: '#fff', color: '#b91c1c', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
      >
        Delete account
      </button>

      {open && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,26,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 460, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px -10px rgba(20,18,26,.35)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1eef7' }}>
              <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 16, color: '#b91c1c' }}>Delete {userName}&apos;s account</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#6b6675', marginTop: 8, lineHeight: 1.5 }}>
                This permanently deletes the account and everything tied to it: {hasListings ? 'their listings and photos, ' : ''}
                every conversation they&apos;re part of (including the other person&apos;s copy of it, since messages
                aren&apos;t stored per-side), uploaded documents, and any reports against any of it. This cannot be undone.
              </div>
            </div>

            <form action={action}>
              <div style={{ padding: 24 }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 8 }}>
                  TYPE {userEmail} TO CONFIRM
                </label>
                <input
                  autoFocus
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder={userEmail}
                  style={{ width: '100%', height: 44, border: '1.5px solid #ece8f3', borderRadius: 10, padding: '0 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#1c1530', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ padding: '0 24px 22px', display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  disabled={!canDelete}
                  style={{ flex: 1, height: 44, border: 'none', borderRadius: 12, background: '#b91c1c', color: '#fff', fontFamily: 'var(--font-bricolage)', fontSize: 14, fontWeight: 700, cursor: canDelete ? 'pointer' : 'default', opacity: canDelete ? 1 : 0.5 }}
                >
                  Delete permanently
                </button>
                <button type="button" onClick={close} style={{ flex: 1, height: 44, border: '1.5px solid #ece8f3', borderRadius: 12, background: '#fff', color: '#1c1530', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
