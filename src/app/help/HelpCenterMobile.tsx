'use client';

import { useState } from 'react';
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

const CATS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'booking', label: 'Booking' },
  { id: 'payments', label: 'Payments' },
  { id: 'account', label: 'Account' },
  { id: 'safety', label: 'Safety' },
];

const ALL_FAQS: { id: number; cat: Category; q: string; a: string }[] = [
  { id: 0, cat: 'booking', q: 'How do I book a room on UniStay?', a: 'Open a listing, check availability, and tap "Request to book." The landlord confirms within their response window, and you’ll get a notification once it’s accepted.' },
  { id: 1, cat: 'booking', q: 'Can I cancel a confirmed booking?', a: 'Yes. Go to Settings → Applications, open the booking, and tap Cancel. Refund eligibility depends on the landlord’s cancellation policy shown at checkout.' },
  { id: 2, cat: 'payments', q: 'What payment methods are supported?', a: 'We support major debit/credit cards and SEPA bank transfer for landlords based in the EU. Payment details are securely processed by our payment partner.' },
  { id: 3, cat: 'payments', q: 'When is my deposit charged?', a: 'Deposits are only charged once a landlord accepts your booking request, never before. You’ll see a clear breakdown of charges before you confirm.' },
  { id: 4, cat: 'account', q: 'How do I verify my identity?', a: 'Go to Settings → Verify identity and upload a valid photo ID. Verification usually completes within a few minutes.' },
  { id: 5, cat: 'account', q: 'How do I change my email or password?', a: 'Open Settings → Profile to update your email, or use the "Forgot password" link on the login screen to reset your password.' },
  { id: 6, cat: 'safety', q: 'How are listings verified?', a: 'Every listing goes through document and ownership checks before it goes live, and we monitor for suspicious activity across the platform.' },
  { id: 7, cat: 'safety', q: 'What should I do if something feels wrong?', a: 'Use the Report button on a listing or profile, or contact support directly — our safety team reviews every report within 24 hours.' },
];

/* ── Main component ───────────────────────────────────────────── */
export default function HelpCenterMobile() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  const toggle = (id: number) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  const q = query.trim().toLowerCase();
  const filtered = ALL_FAQS.filter((f) => {
    const matchesCat = category === 'all' || f.cat === category;
    const matchesQuery = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
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
          <p className={styles.groupLabel}>{resultsLabel}</p>
          <div className={styles.faqCard}>
            {filtered.map((f) => (
              <div key={f.id} className={styles.faqRow}>
                <button type="button" className={styles.faqQuestionBtn} onClick={() => toggle(f.id)}>
                  <span className={styles.faqQuestion}>{f.q}</span>
                  <IChevron open={!!open[f.id]} />
                </button>
                {open[f.id] && <div className={styles.faqAnswer}>{f.a}</div>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className={styles.noResults}>No results for &ldquo;{query}&rdquo;</div>
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
