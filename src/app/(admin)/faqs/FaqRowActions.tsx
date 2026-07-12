'use client'

import { useTransition } from 'react'
import ActionBtn, { TriggerBtn } from '@/components/ui/ActionBtn'
import FaqModal from './FaqModal'
import type { Faq } from '@/lib/types'

interface FaqRowActionsProps {
  faq: Faq
  onUpdate: (fields: { question?: string; answer?: string }) => Promise<void>
  togglePublished: (id: string, published: boolean) => Promise<void>
  onDelete: () => Promise<void>
  onMoveUp?: () => Promise<void>
  onMoveDown?: () => Promise<void>
}

export default function FaqRowActions({ faq, onUpdate, togglePublished, onDelete, onMoveUp, onMoveDown }: FaqRowActionsProps) {
  const [pending, startTransition] = useTransition()

  function handleTogglePublished() {
    return togglePublished(faq.id, !faq.published)
  }

  function handleDelete() {
    if (confirm(`Delete "${faq.question}"? This can't be undone.`)) {
      startTransition(() => onDelete())
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
      <button
        type="button"
        title="Move up"
        disabled={!onMoveUp || pending}
        onClick={() => onMoveUp && startTransition(() => onMoveUp())}
        style={{ ...iconBtnStyle, opacity: onMoveUp ? 1 : 0.3 }}
      >↑</button>
      <button
        type="button"
        title="Move down"
        disabled={!onMoveDown || pending}
        onClick={() => onMoveDown && startTransition(() => onMoveDown())}
        style={{ ...iconBtnStyle, opacity: onMoveDown ? 1 : 0.3 }}
      >↓</button>
      <FaqModal
        trigger={open => <TriggerBtn onClick={open} label="Edit" size="sm" variant="ghost" />}
        title="Edit FAQ"
        confirmLabel="Save"
        initialQuestion={faq.question}
        initialAnswer={faq.answer}
        onSubmit={data => onUpdate({ question: data.question, answer: data.answer })}
      />
      <ActionBtn action={handleTogglePublished} label={faq.published ? 'Unpublish' : 'Publish'} size="sm" variant="ghost" />
      <TriggerBtn onClick={handleDelete} label={pending ? '…' : 'Delete'} size="sm" variant="danger" />
    </div>
  )
}

const iconBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid #ece8f3', background: '#fff',
  color: '#4a4654', fontWeight: 700, cursor: 'pointer', display: 'grid', placeItems: 'center', flex: 'none',
}
