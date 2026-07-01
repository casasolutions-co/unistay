'use client'

import { useTransition } from 'react'

interface SettingToggleProps {
  settingKey: string
  enabled: boolean
  onToggle: (key: string, enabled: boolean) => Promise<void>
}

export default function SettingToggle({ settingKey, enabled, onToggle }: SettingToggleProps) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => onToggle(settingKey, !enabled))}
      style={{
        width: 46, height: 26, borderRadius: 999, border: 'none', cursor: pending ? 'default' : 'pointer',
        background: enabled ? '#6d28d9' : '#e4e0ec', position: 'relative', flex: 'none',
        opacity: pending ? 0.6 : 1, transition: 'background .15s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: enabled ? 23 : 3, width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .15s',
      }} />
    </button>
  )
}
