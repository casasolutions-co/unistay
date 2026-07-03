'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppNav from '../components/AppNav';
import styles from './ContactSupportDesktop.module.css';

const SUPPORT_EMAIL = 'support@unistay.de';

/* ── Icon helpers ─────────────────────────────────────────────── */
function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4bdd2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

function ICheck() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */
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

const TOPICS = ['Booking issue', 'Payments', 'Account', 'Report a problem', 'Something else'];

const SECTIONS = [
  { title: 'Privacy & security', icon: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', href: '/settings#privacy' },
  { title: 'Preferences', icon: 'M5 8h14M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v8a2 2 0 0 0 2 2h7m3 0 3-3-3-3m3 3h-6', href: '/settings#preferences' },
  { title: 'Activity', icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z', href: '/settings#activity' },
  { title: 'Support', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', href: '/contact', active: true },
];

/* ── Main component ──────────────────────────────────────────── */
export default function ContactSupportDesktop() {
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  const canSubmit = email.trim().length > 3 && subject.trim().length > 0 && message.trim().length > 0;

  const handleSubmit = () => {
    if (canSubmit) setSent(true);
  };

  const userInitials = user ? initials(user) : '?';
  const userName = user ? displayName(user) : 'Account';

  return (
    <div className={styles.page}>
      <AppNav />

      <div className={styles.inner}>
        <div className={styles.workspace}>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <Link href="/profile" className={styles.accountCard}>
              <span className={styles.accountAvatar}>{userInitials}</span>
              <div className={styles.accountInfo}>
                <p className={styles.accountName}>{userName}</p>
                <p className={styles.accountSub}>View and edit profile</p>
              </div>
              <IChevronRight />
            </Link>

            <div className={styles.sectionNav}>
              {SECTIONS.map(s => (
                <Link
                  key={s.title}
                  href={s.href}
                  className={`${styles.sectionNavItem} ${s.active ? styles.sectionNavItemActive : ''}`}
                >
                  <span className={`${styles.sectionNavIcon} ${s.active ? styles.sectionNavIconActive : ''}`}>
                    <Icon d={s.icon} size={15} />
                  </span>
                  {s.title}
                </Link>
              ))}
            </div>

            <div className={styles.versionText}>UniStay · v3.2.0</div>
          </aside>

          {/* Content */}
          <div className={styles.content}>

            {!sent && (
              <div>
                <h1 className={styles.pageTitle}>Contact us</h1>
                <p className={styles.pageSubtitle}>Tell us what&apos;s going on — our team typically replies within a day.</p>
              </div>
            )}

            {!sent ? (
              <div className={styles.formWrap}>

                {/* Topic */}
                <div>
                  <p className={styles.groupLabel}>What&apos;s this about?</p>
                  <div className={styles.topicsRow}>
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`${styles.topic} ${topic === t ? styles.topicActive : ''}`}
                        onClick={() => setTopic((prev) => (prev === t ? '' : t))}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form fields */}
                <div className={styles.formCard}>
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Your email</label>
                      <input
                        className={styles.fieldInput}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Subject</label>
                      <input
                        className={styles.fieldInput}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of your issue"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>Message</label>
                    <textarea
                      className={styles.fieldTextarea}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's going on..."
                      rows={7}
                    />
                  </div>
                  <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
                    Send message
                  </button>
                </div>

                {/* Info row */}
                <div className={styles.infoRow}>
                  <div className={styles.infoCard}>
                    <span className={styles.infoIcon}>
                      <Icon d="M4 4h16v16H4z M4 6l8 7 8-7" size={17} />
                    </span>
                    <div>
                      <div className={styles.infoTitle}>Email us</div>
                      <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.infoValueLink}>{SUPPORT_EMAIL}</a>
                    </div>
                  </div>

                  <div className={styles.infoCard}>
                    <span className={styles.infoIcon}>
                      <Icon d="M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" size={17} />
                    </span>
                    <div>
                      <div className={styles.infoTitle}>Response time</div>
                      <div className={styles.infoValue}>Within 1 business day</div>
                    </div>
                  </div>

                  <Link href="/help" className={styles.infoCardLink}>
                    <span className={styles.infoIcon}>
                      <Icon d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" size={17} />
                    </span>
                    <div className={styles.infoBody}>
                      <div className={styles.infoTitle}>Check the FAQs</div>
                      <div className={styles.infoSub}>Get instant answers</div>
                    </div>
                    <IChevronRight />
                  </Link>
                </div>

              </div>
            ) : (
              <div className={styles.successCard}>
                <span className={styles.successIcon}><ICheck /></span>
                <p className={styles.successTitle}>Message sent</p>
                <p className={styles.successSub}>
                  Thanks for reaching out. Our support team will get back to you at {email} within one business day.
                </p>
                <Link href="/settings" className={styles.successBtn}>Back to settings</Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
