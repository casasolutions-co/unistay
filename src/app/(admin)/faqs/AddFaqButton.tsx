'use client'

import { TriggerBtn } from '@/components/ui/ActionBtn'
import FaqModal from './FaqModal'
import type { FaqCategory } from '@/lib/types'

interface AddFaqButtonProps {
  initialCategory: FaqCategory
  createFaq: (category: FaqCategory, question: string, answer: string, published: boolean) => Promise<void>
}

export default function AddFaqButton({ initialCategory, createFaq }: AddFaqButtonProps) {
  return (
    <FaqModal
      trigger={open => <TriggerBtn onClick={open} label="+ Add FAQ" variant="primary" size="md" />}
      title="Add FAQ"
      confirmLabel="Add FAQ"
      showCategory
      initialCategory={initialCategory}
      onSubmit={data => createFaq(data.category, data.question, data.answer, true)}
    />
  )
}
