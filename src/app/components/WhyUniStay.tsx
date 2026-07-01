import styles from './WhyUniStay.module.css';

const FEATURES = [
  {
    title: 'Virtual Tours',
    desc: 'Explore every corner with 360° virtual tours. See your future home without leaving yours.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="14" height="12" rx="2.5" /><path d="M23 7.5 16 11l7 3.5v-7Z" />
      </svg>
    ),
  },
  {
    title: 'Flexible Viewings',
    desc: 'Book in-person tours at your convenience — evenings and weekends included.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18" /><path d="M8 3v4" /><path d="M16 3v4" />
      </svg>
    ),
  },
  {
    title: 'Prime Locations',
    desc: 'All flats within walking distance of universities and public transport.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: 'Verified & Safe',
    desc: 'Every listing is personally inspected and verified by our team.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </svg>
    ),
  },
  {
    title: 'Move In Fast',
    desc: 'From search to keys in hand — complete the process in as little as 3 days.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: 'Dedicated Support',
    desc: 'Your personal housing advisor is available 24/7 via chat, phone, or email.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    ),
  },
];

export default function WhyUniStay() {
  return (
    <section className={styles.section}>
      <div className={styles.glow} />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Why choose us</p>
        <h2 className={styles.heading}>Everything you need for a smooth move</h2>
        <p className={styles.subline}>
          We&apos;ve simplified student housing so you can focus on what matters — your studies and new adventures.
        </p>

        <div className={styles.grid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.card}>
              <div className={styles.iconTile}>{f.icon}</div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
