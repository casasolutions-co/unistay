'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppNav from './AppNav';
import styles from './HelpContactDesktop.module.css';

const SUPPORT_EMAIL = 'support@unistay.de';

/* ── Icon helpers ─────────────────────────────────────────────── */
function Icon({ d, size = 17 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function ISearch() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9a94a8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function IChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ''}`}
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a94a8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ICheck() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const TOPICS = ['Booking issue', 'Payments', 'Account', 'Report a problem', 'Something else'];

/* ── FAQ data ─────────────────────────────────────────────────── */
type Category = 'all' | 'booking' | 'payments' | 'account' | 'safety';

interface Faq {
  id: string;
  category: Exclude<Category, 'all'>;
  question: string;
  answer: string;
}

const CATS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'booking', label: 'Booking' },
  { id: 'payments', label: 'Payments' },
  { id: 'account', label: 'Account' },
  { id: 'safety', label: 'Safety' },
];

/* ── Main component ──────────────────────────────────────────── */
export default function HelpContactDesktop() {
  const [user, setUser] = useState<User | null>(null);

  // FAQ state
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  // Contact form state
  const [topic, setTopic] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  useEffect(() => {
    fetch('/api/faqs')
      .then(res => (res.ok ? res.json() : { faqs: [] }))
      .then((data: { faqs: Faq[] }) => {
        setFaqs(data.faqs ?? []);
        if (data.faqs?.[0]) setOpen({ [data.faqs[0].id]: true });
      })
      .catch(() => setFaqs([]))
      .finally(() => setFaqsLoading(false));
  }, []);

  const toggleFaq = (id: string) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

  const q = query.trim().toLowerCase();
  const filtered = faqs.filter(f => {
    const matchesCat = category === 'all' || f.category === category;
    const matchesQuery = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });
  const resultsLabel = q ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}` : 'Frequently asked';

  const canSubmit = email.trim().length > 3 && subject.trim().length > 0 && message.trim().length > 0;

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
    <div className={styles.page}>
      <AppNav />

      <div className={styles.inner}>
        <div className={styles.workspace}>

          {/* Content */}
          <div className={styles.content}>
            <div>
              <h1 className={styles.pageTitle}>Help &amp; support</h1>
              <p className={styles.pageSubtitle}>Browse FAQs or send us a message — our team typically replies within a day.</p>
            </div>

            <div className={styles.twoCol}>

              {/* FAQ column */}
              <div className={styles.faqCol}>
                <div className={styles.searchBar}>
                  <ISearch />
                  <input
                    className={styles.searchInput}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search FAQs"
                  />
                </div>

                <div className={styles.chipsRow}>
                  {CATS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.chip} ${category === c.id ? styles.chipActive : ''}`}
                      onClick={() => setCategory(c.id)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <p className={styles.groupLabel}>{faqsLoading ? 'Frequently asked' : resultsLabel}</p>
                <div className={styles.faqCard}>
                  {faqsLoading && <div className={styles.noResults}>Loading…</div>}
                  {!faqsLoading && filtered.map(f => (
                    <div key={f.id} className={styles.faqRow}>
                      <button type="button" className={styles.faqQuestionBtn} onClick={() => toggleFaq(f.id)}>
                        <span className={styles.faqQuestion}>{f.question}</span>
                        <IChevronDown open={!!open[f.id]} />
                      </button>
                      {open[f.id] && <div className={styles.faqAnswer}>{f.answer}</div>}
                    </div>
                  ))}
                  {!faqsLoading && filtered.length === 0 && (
                    <div className={styles.noResults}>
                      {query ? <>No results for &ldquo;{query}&rdquo;</> : 'No FAQs yet.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact column */}
              <div className={styles.contactCol}>
                {!sent ? (
                  <>
                    <p className={styles.groupLabel}>What&apos;s this about?</p>
                    <div className={styles.topicsRow}>
                      {TOPICS.map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`${styles.topic} ${topic === t ? styles.topicActive : ''}`}
                          onClick={() => setTopic(prev => (prev === t ? '' : t))}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className={styles.formCard}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Your email</label>
                        <input
                          className={styles.fieldInput}
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Subject</label>
                        <input
                          className={styles.fieldInput}
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder="Brief summary of your issue"
                        />
                      </div>
                      <div>
                        <label className={styles.fieldLabel}>Message</label>
                        <textarea
                          className={styles.fieldTextarea}
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Tell us what's going on..."
                          rows={6}
                        />
                      </div>
                      {error && <p className={styles.errorText}>{error}</p>}
                      <button type="button" className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit || sending}>
                        {sending ? 'Sending…' : 'Send message'}
                      </button>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoCard}>
                        <span className={styles.infoIcon}>
                          <Icon d="M4 4h16v16H4z M4 6l8 7 8-7" size={16} />
                        </span>
                        <div>
                          <div className={styles.infoTitle}>Email us</div>
                          <a href={`mailto:${SUPPORT_EMAIL}`} className={styles.infoValueLink}>{SUPPORT_EMAIL}</a>
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <span className={styles.infoIcon}>
                          <Icon d="M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" size={16} />
                        </span>
                        <div>
                          <div className={styles.infoTitle}>Response time</div>
                          <div className={styles.infoValue}>Within 1 business day</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.successCard}>
                    <span className={styles.successIcon}><ICheck /></span>
                    <p className={styles.successTitle}>Message sent</p>
                    <p className={styles.successSub}>
                      Thanks for reaching out. Our support team will reply in Messages — we&apos;ll also follow up at {email} within one business day.
                    </p>
                    <Link href="/messages" className={styles.successBtn}>View in Messages</Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
