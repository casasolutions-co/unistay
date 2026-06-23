import styles from './TrustBand.module.css';

const AVATAR_SHIFTS = ['0px', '-9px', '-9px', '-9px', '-9px'];

export default function TrustBand() {
  return (
    <section className={styles.band}>
      <div className={styles.inner}>

        {/* Trustpilot card */}
        <div className={styles.card}>
          <div className={styles.cardRow}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#00b67a">
              <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
            </svg>
            <span className={styles.tpLabel}>Trustpilot</span>
          </div>
          <div className={styles.stars} style={{ color: '#00b67a' }}>★★★★★</div>
          <div className={styles.cardSub}>TrustScore: 4.8 | 147 reviews</div>
        </div>

        {/* Students card */}
        <div className={styles.card}>
          <div className={styles.avatarRow}>
            {AVATAR_SHIFTS.map((shift, i) => (
              <span
                key={i}
                className={styles.avatar}
                style={{ marginLeft: shift }}
              />
            ))}
          </div>
          <div>
            <div className={styles.statNumber}>1200+</div>
            <div className={styles.cardSub}>Trusted by students all around the world</div>
          </div>
        </div>

        {/* Google rating */}
        <div className={styles.googleRow}>
          <span className={styles.googleWord}>Google</span>
          <span className={styles.stars} style={{ color: '#fbbc05', fontSize: 24 }}>★★★★★</span>
        </div>

      </div>
    </section>
  );
}
