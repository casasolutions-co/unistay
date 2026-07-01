import { getAppSettings } from '@/lib/data'
import { toggleAppSetting } from '@/lib/actions'
import SettingToggle from './SettingToggle'

export default async function SettingsPage() {
  const settings = await getAppSettings()

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: '0 0 4px' }}>Settings</h1>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: '0 0 18px' }}>Site-wide kill switches. Changes apply immediately across UniStay.</p>

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        {settings.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderBottom: i < settings.length - 1 ? '1px solid #f1eef7' : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1c1530' }}>{s.label}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9a94a8', marginTop: 2 }}>{s.description}</div>
            </div>
            <SettingToggle settingKey={s.key} enabled={s.enabled} onToggle={toggleAppSetting} />
          </div>
        ))}
      </div>
    </>
  )
}
