'use client'

import ActionBtn, { TriggerBtn } from '@/components/ui/ActionBtn'
import ReasonModal from '@/components/ui/ReasonModal'
import type { ReportStatus } from '@/lib/types'

interface ReportRowActionsProps {
  status: ReportStatus
  resolve: (note: string) => Promise<void>
  dismiss: (note: string) => Promise<void>
  redact?: () => Promise<void>
  size?: 'sm' | 'md'
}

export default function ReportRowActions({ status, resolve, dismiss, redact, size = 'sm' }: ReportRowActionsProps) {
  if (status !== 'open') return null
  return (
    <>
      {redact && <ActionBtn action={redact} label="Redact message" size={size} variant="danger" />}
      <ReasonModal
        trigger={open => <TriggerBtn onClick={open} label="Resolve" size={size} variant="primary" />}
        title="Resolve report"
        description="Record what action was taken, for the audit trail."
        confirmLabel="Resolve"
        placeholder="e.g. warned the landlord, listing archived"
        danger={false}
        onSubmit={note => resolve(note)}
      />
      <ReasonModal
        trigger={open => <TriggerBtn onClick={open} label="Dismiss" size={size} variant="ghost" />}
        title="Dismiss report"
        description="Record why this report needed no action."
        confirmLabel="Dismiss"
        placeholder="e.g. no policy violation found"
        danger={false}
        onSubmit={note => dismiss(note)}
      />
    </>
  )
}
