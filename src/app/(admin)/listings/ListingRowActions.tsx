'use client'

import ActionBtn, { TriggerBtn } from '@/components/ui/ActionBtn'
import ReasonModal from '@/components/ui/ReasonModal'
import type { ListingStatus } from '@/lib/types'

interface ListingRowActionsProps {
  status: ListingStatus
  approve: () => Promise<void>
  reject: (reason: string) => Promise<void>
  archive: (reason: string) => Promise<void>
  restore: () => Promise<void>
  size?: 'sm' | 'md'
}

export default function ListingRowActions({ status, approve, reject, archive, restore, size = 'sm' }: ListingRowActionsProps) {
  if (status === 'pending_review') {
    return (
      <>
        <ActionBtn action={approve} label="Approve" size={size} />
        <ReasonModal
          trigger={open => <TriggerBtn onClick={open} label="Reject" size={size} variant="danger" />}
          title="Reject listing"
          description="Shown to the landlord — they can fix and resubmit."
          confirmLabel="Reject listing"
          placeholder="e.g. photos don't match the description"
          onSubmit={reason => reject(reason)}
        />
      </>
    )
  }
  if (status === 'published') {
    return (
      <ReasonModal
        trigger={open => <TriggerBtn onClick={open} label="Take down" size={size} variant="danger" />}
        title="Archive listing"
        description="Pulls a live listing down for a policy violation."
        confirmLabel="Archive listing"
        placeholder="Reason for takedown…"
        onSubmit={reason => archive(reason)}
      />
    )
  }
  if (status === 'rejected' || status === 'archived') {
    return <ActionBtn action={restore} label="Restore" size={size} variant="ghost" />
  }
  return null
}
