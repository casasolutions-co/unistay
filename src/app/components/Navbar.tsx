import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      {/* Wordmark */}
      <div className={styles.brand}>
        <div className={styles.logoWrap}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11.2 12 4l9 7.2" />
            <path d="M5.5 9.8V20h13V9.8" />
            <path d="M10 20v-5h4v5" />
          </svg>
        </div>
        <span className={styles.wordmark}>UniStay</span>
      </div>

      {/* Links */}
      <div className={styles.links}>
        <a href="#" className={styles.navLink}>View Listings</a>
        <a href="/login" className={styles.loginBtn}>Login / Register</a>
      </div>
    </nav>
  );
}
