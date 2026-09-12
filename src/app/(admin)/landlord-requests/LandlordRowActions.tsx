'use client'

import ActionBtn, { TriggerBtn } from '@/components/ui/ActionBtn'
import ReasonModal from '@/components/ui/ReasonModal'

interface LandlordRowActionsProps {
  approve: () => Promise<void>
  reject: (note: string) => Promise<void>
  size?: 'sm' | 'md'
}

export default function LandlordRowActions({ approve, reject, size = 'sm' }: LandlordRowActionsProps) {
  return (
    <>
      <ActionBtn action={approve} label="Approve" size={size} />
      <ReasonModal
        trigger={open => <TriggerBtn onClick={open} label="Reject" size={size} variant="danger" />}
        title="Reject landlord application"
        description="This note is shown to the applicant explaining why their application was rejected."
        confirmLabel="Reject application"
        placeholder="e.g. Could not confirm ownership of the property"
        onSubmit={note => reject(note)}
      />
    </>
  )
}
