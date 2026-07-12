'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './HelpCenterMobile.module.css';

/* ── Icon helpers ─────────────────────────────────────────────── */
function IBack() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
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

function IChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ''}`}
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a94a8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IContact() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ── Data ─────────────────────────────────────────────────────── */
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

/* ── Main component ───────────────────────────────────────────── */
export default function HelpCenterMobile() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faqs')
      .then((res) => (res.ok ? res.json() : { faqs: [] }))
      .then((data: { faqs: Faq[] }) => {
        setFaqs(data.faqs ?? []);
        if (data.faqs?.[0]) setOpen({ [data.faqs[0].id]: true });
      })
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const q = query.trim().toLowerCase();
  const filtered = faqs.filter((f) => {
    const matchesCat = category === 'all' || f.category === category;
    const matchesQuery =
      !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const resultsLabel = q ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}` : 'Frequently asked';

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/settings" className={styles.backBtn} aria-label="Back to settings">
          <IBack />
        </Link>
        <h1 className={styles.headerTitle}>Help center</h1>
      </div>

      {/* Scrollable body */}
      <div className={styles.body}>

        {/* Search */}
        <div className={styles.searchBar}>
          <ISearch />
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQs"
          />
        </div>

        {/* Category chips */}
        <div className={styles.chipsRow}>
          {CATS.map((c) => (
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

        {/* FAQ group */}
        <div style={{ marginBottom: 22 }}>
          <p className={styles.groupLabel}>{loading ? 'Frequently asked' : resultsLabel}</p>
          <div className={styles.faqCard}>
            {loading && <div className={styles.noResults}>Loading…</div>}
            {!loading &&
              filtered.map((f) => (
                <div key={f.id} className={styles.faqRow}>
                  <button type="button" className={styles.faqQuestionBtn} onClick={() => toggle(f.id)}>
                    <span className={styles.faqQuestion}>{f.question}</span>
                    <IChevron open={!!open[f.id]} />
                  </button>
                  {open[f.id] && <div className={styles.faqAnswer}>{f.answer}</div>}
                </div>
              ))}
            {!loading && filtered.length === 0 && (
              <div className={styles.noResults}>
                {query ? <>No results for &ldquo;{query}&rdquo;</> : 'No FAQs yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div className={styles.contactCta}>
          <p className={styles.contactTitle}>Still need help?</p>
          <p className={styles.contactSub}>Our support team usually replies within a day.</p>
          <Link href="/contact" className={styles.contactBtn}>
            <IContact />
            Contact support
          </Link>
        </div>

      </div>
    </div>
  );
}
