'use client'

import ActionBtn, { TriggerBtn } from '@/components/ui/ActionBtn'
import ReasonModal from '@/components/ui/ReasonModal'

interface DocRowActionsProps {
  approve: () => Promise<void>
  reject: (reason: string) => Promise<void>
  size?: 'sm' | 'md'
}

export default function DocRowActions({ approve, reject, size = 'sm' }: DocRowActionsProps) {
  return (
    <>
      <ActionBtn action={approve} label="Approve" size={size} />
      <ReasonModal
        trigger={open => <TriggerBtn onClick={open} label="Reject" size={size} variant="danger" />}
        title="Reject document"
        description="This reason is shown to the user so they know why the document was rejected."
        confirmLabel="Reject document"
        placeholder="e.g. image too blurry to verify"
        onSubmit={reason => reject(reason)}
      />
    </>
  )
}
