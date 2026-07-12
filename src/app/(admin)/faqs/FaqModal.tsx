'use client'

import { useState, useTransition } from 'react'
import type { FaqCategory } from '@/lib/types'

const CATEGORY_OPTIONS: { value: FaqCategory; label: string }[] = [
  { value: 'booking', label: 'Booking' },
  { value: 'payments', label: 'Payments' },
  { value: 'account', label: 'Account' },
  { value: 'safety', label: 'Safety' },
]

interface FaqModalProps {
  trigger: (open: () => void) => React.ReactNode
  title: string
  confirmLabel: string
  initialQuestion?: string
  initialAnswer?: string
  initialCategory?: FaqCategory
  showCategory?: boolean
  onSubmit: (data: { question: string; answer: string; category: FaqCategory }) => Promise<void>
}

export default function FaqModal({
  trigger, title, confirmLabel,
  initialQuestion = '', initialAnswer = '', initialCategory = 'booking', showCategory = false,
  onSubmit,
}: FaqModalProps) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState(initialQuestion)
  const [answer, setAnswer] = useState(initialAnswer)
  const [category, setCategory] = useState<FaqCategory>(initialCategory)
  const [pending, startTransition] = useTransition()

  function openModal() {
    setQuestion(initialQuestion)
    setAnswer(initialAnswer)
    setCategory(initialCategory)
    setOpen(true)
  }

  function close() {
    setOpen(false)
  }

  function submit() {
    if (!question.trim() || !answer.trim()) return
    startTransition(async () => {
      await onSubmit({ question: question.trim(), answer: answer.trim(), category })
      close()
    })
  }

  return (
    <>
      {trigger(openModal)}
      {open && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,26,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 480, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px -10px rgba(20,18,26,.35)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1eef7' }}>
              <div style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 16 }}>{title}</div>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {showCategory && (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 6 }}>CATEGORY</div>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as FaqCategory)}
                    style={{ width: '100%', border: '1.5px solid #ece8f3', borderRadius: 10, padding: '9px 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#1c1530' }}
                  >
                    {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 6 }}>QUESTION</div>
                <input
                  autoFocus
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. How do I book a room?"
                  style={{ width: '100%', border: '1.5px solid #ece8f3', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#1c1530' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', marginBottom: 6 }}>ANSWER</div>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Answer shown to students…"
                  rows={4}
                  style={{ width: '100%', resize: 'vertical', border: '1.5px solid #ece8f3', borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, color: '#1c1530' }}
                />
              </div>
            </div>
            <div style={{ padding: '0 24px 22px', display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={pending || !question.trim() || !answer.trim()}
                onClick={submit}
                style={{
                  flex: 1, height: 44, border: 'none', borderRadius: 12,
                  background: 'linear-gradient(180deg,#7c3aed,#6d28d9)',
                  color: '#fff', fontFamily: 'var(--font-bricolage)', fontSize: 14, fontWeight: 700,
                  cursor: pending || !question.trim() || !answer.trim() ? 'default' : 'pointer',
                  opacity: pending || !question.trim() || !answer.trim() ? 0.6 : 1,
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
