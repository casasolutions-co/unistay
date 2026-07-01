'use client';

import { useRouter } from 'next/navigation';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    title: 'Search & Browse',
    desc: 'Browse through verified student flats in your preferred city and filter by budget, size, and amenities.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
      </svg>
    ),
  },
  {
    title: 'Virtual / In-Person Tour',
    desc: 'Take a 360° virtual tour or schedule an in-person visit to explore the flat from anywhere.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="14" height="12" rx="2.5" /><path d="M23 7.5 16 11l7 3.5v-7Z" />
      </svg>
    ),
  },
  {
    title: 'Quick Booking',
    desc: 'Submit your documents online and our team will verify everything within 24 hours.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18" /><path d="M8 3v4" /><path d="M16 3v4" />
      </svg>
    ),
  },
  {
    title: 'Move In',
    desc: "Sign the contract digitally and move into your new home — it's that simple!",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.2 12 4l9 7.2" /><path d="M5.5 9.8V20h13V9.8" /><path d="M10 20v-5h4v5" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  const router = useRouter();

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Simple &amp; straightforward</p>
        <h2 className={styles.heading}>How it works</h2>
        <p className={styles.subline}>Find your perfect student home in just four simple steps</p>

        <div className={styles.steps}>
          <div className={styles.connector} />
          {STEPS.map((step, i) => (
            <div key={step.title} className={styles.step}>
              <div className={styles.iconWrap}>
                <div className={styles.iconCircle}>{step.icon}</div>
                <span className={styles.badge}>{i + 1}</span>
              </div>
              <div className={styles.stepText}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className={styles.cta} onClick={() => router.push('/search')}>
          Start your search now
        </button>
      </div>
    </section>
  );
}
