'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './ContactSupportMobile.module.css';

const SUPPORT_EMAIL = 'support@unistay.de';

/* ── Icon helpers ─────────────────────────────────────────────── */
function IBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" />
      <path d="m4 6 8 7 8-7" />
    </svg>
  );
}

function IClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
    </svg>
  );
}

function ICheck() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const TOPICS = ['Booking issue', 'Payments', 'Account', 'Report a problem', 'Something else'];

/* ── Main component ───────────────────────────────────────────── */
export default function ContactSupportMobile() {
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || sending) return;
    if (!user) {
      setError('Please sign in to send a message.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, subject: subject.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error('request failed');
      setSent(true);
    } catch {
      setError('Something went wrong sending your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/help" className={styles.backBtn} aria-label="Back to help center">
          <IBack />
        </Link>
        <h1 className={styles.headerTitle}>Contact support</h1>
      </div>

      {/* Scrollable body */}
      <div className={styles.body}>

        {sent ? (
          <div className={styles.successWrap}>
            <span className={styles.successIcon}><ICheck /></span>
            <p className={styles.successTitle}>Message sent</p>
            <p className={styles.successSub}>
              Thanks for reaching out. Our support team will reply in Messages within one business day.
            </p>
            <Link href="/messages" className={styles.successBtn}>View in Messages</Link>
          </div>
        ) : (
          <>
            {/* Quick contact */}
            <div className={styles.quickRow}>
              <div className={styles.quickCard}>
                <span className={styles.quickIcon}><IMail /></span>
                <span className={styles.quickLabel}>Email us</span>
                <a href={`mailto:${SUPPORT_EMAIL}`} className={`${styles.quickValue} ${styles.quickValueLink}`}>{SUPPORT_EMAIL}</a>
              </div>
              <div className={styles.quickCard}>
                <span className={styles.quickIcon}><IClock /></span>
                <span className={styles.quickLabel}>Response time</span>
                <span className={styles.quickValue}>Within 1 business day</span>
              </div>
            </div>

            {/* Topic */}
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

            {/* Form fields */}
            <div className={styles.form}>
              <div>
                <label className={styles.fieldLabel}>Subject</label>
                <input
                  className={styles.fieldInput}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                />
              </div>
              <div>
                <label className={styles.fieldLabel}>Message</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's going on..."
                  rows={5}
                />
              </div>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}
            <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit || sending}>
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
