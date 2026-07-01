'use client'

import ActionBtn, { TriggerBtn } from '@/components/ui/ActionBtn'
import ReasonModal from '@/components/ui/ReasonModal'
import type { UserStatus } from '@/lib/types'

interface UserRowActionsProps {
  status: UserStatus
  verify: () => Promise<void>
  reject: (note: string) => Promise<void>
  ban: (reason: string, expiresAt: string | null) => Promise<void>
  unban: () => Promise<void>
  size?: 'sm' | 'md'
}

export default function UserRowActions({ status, verify, reject, ban, unban, size = 'sm' }: UserRowActionsProps) {
  if (status === 'unverified' || status === 'pending') {
    return (
      <>
        <ActionBtn action={verify} label="Verify" size={size} />
        <ReasonModal
          trigger={open => <TriggerBtn onClick={open} label="Reject" size={size} variant="danger" />}
          title="Reject verification"
          description="This note is shown to the user explaining why their verification was rejected."
          confirmLabel="Reject verification"
          placeholder="e.g. ID photo unreadable, please re-upload"
          onSubmit={note => reject(note)}
        />
        <ReasonModal
          trigger={open => <TriggerBtn onClick={open} label="Ban" size={size} variant="ghost" />}
          title="Ban user"
          description="Blocks login and posting. Set a duration or leave permanent."
          confirmLabel="Ban user"
          placeholder="Reason for ban…"
          showDuration
          onSubmit={(reason, expiresAt) => ban(reason, expiresAt)}
        />
      </>
    )
  }
  if (status === 'verified') {
    return (
      <ReasonModal
        trigger={open => <TriggerBtn onClick={open} label="Ban" size={size} variant="danger" />}
        title="Ban user"
        description="Blocks login and posting. Set a duration or leave permanent."
        confirmLabel="Ban user"
        placeholder="Reason for ban…"
        showDuration
        onSubmit={(reason, expiresAt) => ban(reason, expiresAt)}
      />
    )
  }
  if (status === 'rejected') {
    return (
      <>
        <ActionBtn action={verify} label="Verify" size={size} />
        <ReasonModal
          trigger={open => <TriggerBtn onClick={open} label="Ban" size={size} variant="ghost" />}
          title="Ban user"
          confirmLabel="Ban user"
          placeholder="Reason for ban…"
          showDuration
          onSubmit={(reason, expiresAt) => ban(reason, expiresAt)}
        />
      </>
    )
  }
  if (status === 'banned') {
    return <ActionBtn action={unban} label="Unban" size={size} variant="ghost" />
  }
  return null
}
