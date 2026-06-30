'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppNav from '../components/AppNav';
import styles from './ProfileDesktop.module.css';

/* ── Helpers ── */
function initials(user: User): string {
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

function displayName(user: User): string {
  return user.displayName ?? user.email?.split('@')[0] ?? 'Account';
}

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Nav items ── */
type Section = 'profile' | 'verify' | 'prefs' | 'activity' | 'settings';

const NAV: { k: Section; label: string; icon: string }[] = [
  { k: 'profile',   label: 'Profile',      icon: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
  { k: 'verify',    label: 'Verification', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10ZM9 12l2 2 4-4' },
  { k: 'prefs',     label: 'Preferences',  icon: 'M3 11.2 12 4l9 7.2M5.5 9.8V20h13V9.8' },
  { k: 'activity',  label: 'Activity',     icon: 'M3 3v18h18M7 14l3-3 3 3 4-5' },
  { k: 'settings',  label: 'Settings',     icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z' },
];

/* ── Profile section ── */
function ProfileSection({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: user.displayName ?? '',
    email: user.email ?? '',
    phone: '+49 151 234 5678',
    org: 'LMU München',
    role: 'M.Sc. Computer Science',
    graduation: '2026',
  });

  const fields: { label: string; key: keyof typeof form; verified?: boolean }[] = [
    { label: 'Full name',          key: 'fullName' },
    { label: 'Email address',      key: 'email',      verified: true },
    { label: 'Phone',              key: 'phone',       verified: true },
    { label: 'University',         key: 'org',         verified: true },
    { label: 'Programme',          key: 'role' },
    { label: 'Expected graduation',key: 'graduation' },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <h2>Personal information</h2>
          <p>This is what hosts see when you apply.</p>
        </div>
        <button
          type="button"
          className={`${styles.editBtn} ${editing ? styles.editBtnActive : ''}`}
          onClick={() => setEditing(e => !e)}
        >
          <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" size={16} />
          {editing ? 'Editing…' : 'Edit'}
        </button>
      </div>

      <div className={styles.fieldsGrid}>
        {fields.map(f => (
          <div key={f.key}>
            <label className={styles.fieldLabel}>{f.label}</label>
            {editing ? (
              <input
                type="text"
                className={styles.fieldInput}
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              />
            ) : (
              <div className={styles.fieldValue}>
                {form[f.key] || '—'}
                {f.verified && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1f8a5b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className={styles.editActions}>
          <button type="button" className={styles.saveBtn} onClick={() => setEditing(false)}>
            Save changes
          </button>
          <button type="button" className={styles.cancelBtn} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Verification section ── */
function VerifySection({ user }: { user: User }) {
  const verifications = [
    {
      label: 'Student email', sub: user.email ?? 'Not set',
      iconBg: '#e9f6ef', iconColor: '#1f8a5b', done: true,
      icon: 'M22 10 12 5 2 10l10 5 10-5ZM6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5',
    },
    {
      label: 'Phone number', sub: 'Verified by SMS',
      iconBg: '#e9f6ef', iconColor: '#1f8a5b', done: true,
      icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92Z',
    },
    {
      label: 'Government ID', sub: 'Boosts host trust',
      iconBg: '#f3effe', iconColor: '#6d28d9', done: false,
      icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM7 8h4M7 12h6M15 8h2M15 12h2',
    },
    {
      label: 'Proof of enrolment', sub: 'Upload current certificate',
      iconBg: '#f3effe', iconColor: '#6d28d9', done: false,
      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4',
    },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.verifyHeader}>
        <div className={styles.panelHeaderLeft}>
          <h2>Verification</h2>
          <p>Verified profiles get priority responses from hosts.</p>
        </div>
        <div className={styles.verifyCompletion}>
          <span className={styles.verifyPct}>75%</span>
          <span className={styles.verifyPctLabel}>complete</span>
        </div>
      </div>

      <div className={styles.verifyList}>
        {verifications.map(v => (
          <div key={v.label} className={styles.verifyRow}>
            <span className={styles.verifyIcon} style={{ background: v.iconBg, color: v.iconColor }}>
              <Icon d={v.icon} size={20} />
            </span>
            <div className={styles.verifyBody}>
              <div className={styles.verifyRowLabel}>{v.label}</div>
              <div className={styles.verifyRowSub}>{v.sub}</div>
            </div>
            {v.done ? (
              <span className={styles.verifyDone}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Verified
              </span>
            ) : (
              <button type="button" className={styles.verifyNowBtn}>Verify now</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Preferences section ── */
function PrefsSection() {
  const stats = [
    { label: 'Budget',        value: '€600 – €950' },
    { label: 'Move-in',       value: 'Oct 2026' },
    { label: 'Duration',      value: '6–12 months' },
    { label: 'Preferred area',value: 'Maxvorstadt' },
  ];
  const tags = ['Studio', 'Shared flat (WG)', 'Furnished', 'Pet-friendly', 'Near U-Bahn'];

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <h2>Housing preferences</h2>
          <p>We use these to surface better matches for you.</p>
        </div>
      </div>

      <div className={styles.prefGrid}>
        {stats.map(p => (
          <div key={p.label} className={styles.prefStat}>
            <p className={styles.prefStatLabel}>{p.label}</p>
            <p className={styles.prefStatValue}>{p.value}</p>
          </div>
        ))}
      </div>

      <div className={styles.tagsLabel}>Looking for</div>
      <div className={styles.tags}>
        {tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
      </div>
    </div>
  );
}

/* ── Activity section ── */
function ActivitySection() {
  const items = [
    { label: 'Saved homes',  count: 12, icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z' },
    { label: 'Applications', count: 3,  icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6' },
    { label: 'Messages',     count: 5,  icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader} style={{ marginBottom: 22 }}>
        <div className={styles.panelHeaderLeft}>
          <h2>Your activity</h2>
        </div>
      </div>

      <div className={styles.activityGrid}>
        {items.map(a => (
          <a key={a.label} href="#" className={styles.activityCard}>
            <span className={styles.activityIcon}><Icon d={a.icon} size={20} /></span>
            <div className={styles.activityCount}>{a.count}</div>
            <div className={styles.activityLabel}>{a.label}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Settings section ── */
function SettingsSection() {
  const [toggles, setToggles] = useState({ emailAlerts: true, smsAlerts: false, newsletter: true });

  const defs: { k: keyof typeof toggles; label: string; sub: string }[] = [
    { k: 'emailAlerts', label: 'Email alerts for new matches',  sub: 'A daily digest of homes that fit your filters' },
    { k: 'smsAlerts',   label: 'SMS reminders',                 sub: 'Texts about application deadlines' },
    { k: 'newsletter',  label: 'UniStay newsletter',            sub: 'Housing tips and city guides, monthly' },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <h2>Account settings</h2>
        </div>
      </div>

      <div className={styles.settingsList}>
        {defs.map(d => {
          const on = toggles[d.k];
          return (
            <div key={d.k} className={styles.settingRow}>
              <div className={styles.settingBody}>
                <div className={styles.settingLabel}>{d.label}</div>
                <div className={styles.settingSub}>{d.sub}</div>
              </div>
              <button
                type="button"
                className={styles.toggle}
                style={{ background: on ? '#6d28d9' : '#d8d2e6' }}
                onClick={() => setToggles(prev => ({ ...prev, [d.k]: !prev[d.k] }))}
                aria-label={d.label}
              >
                <span className={styles.toggleKnob} style={{ left: on ? 25 : 3 }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function ProfileDesktop() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>('profile');

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const userInitials = user ? initials(user) : '?';
  const userName = user ? displayName(user) : 'Account';

  return (
    <div className={styles.page}>
      <AppNav />

      <div className={styles.inner}>
        <div className={styles.titleEyebrow}>Account</div>
        <h1 className={styles.title}>Manage your profile</h1>

        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.identityCard}>
              <div className={styles.identityAvatar}>{userInitials}</div>
              <p className={styles.identityName}>{userName}</p>
              <p className={styles.identityOrg}>LMU München</p>
              <span className={styles.identityBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Verified student
              </span>
            </div>

            <nav className={styles.sideNav}>
              {NAV.map(n => (
                <button
                  key={n.k}
                  type="button"
                  className={`${styles.navItem} ${section === n.k ? styles.navItemActive : ''}`}
                  onClick={() => setSection(n.k)}
                >
                  <span className={`${styles.navBar} ${section === n.k ? styles.navBarActive : ''}`} />
                  <Icon d={n.icon} />
                  {n.label}
                </button>
              ))}
            </nav>

            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Log out
            </button>
          </aside>

          {/* Content */}
          <div>
            {section === 'profile'   && user && <ProfileSection user={user} />}
            {section === 'verify'    && user && <VerifySection user={user} />}
            {section === 'prefs'     && <PrefsSection />}
            {section === 'activity'  && <ActivitySection />}
            {section === 'settings'  && <SettingsSection />}
          </div>
        </div>
      </div>
    </div>
  );
}
