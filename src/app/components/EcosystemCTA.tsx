import styles from './EcosystemCTA.module.css';

const PRODUCTS = ['StudyMatch AI', 'UniStay', 'Ausbildung', 'Ausbildung B2B'];

function IconHome() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 4l9 6.5" /><path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}

export default function EcosystemCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Our ecosystem</p>
        <h2 className={styles.heading}>
          <span className={styles.accent}>Do more</span> than just browse apartments online
        </h2>
        <div className={styles.pills}>
          {PRODUCTS.map(name => (
            <div key={name} className={styles.pill}>
              <IconHome />
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
