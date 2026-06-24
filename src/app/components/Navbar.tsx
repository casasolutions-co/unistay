import Image from 'next/image';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      {/* Wordmark */}
      <div className={styles.brand}>
        <Image src="/primary-logo.png" alt="UniStay" width={2049} height={1772} style={{ height: 44, width: 'auto' }} priority />
      </div>

      {/* Links */}
      <div className={styles.links}>
        <a href="#" className={styles.navLink}>View Listings</a>
        <a href="/login" className={styles.loginBtn}>Login / Register</a>
      </div>
    </nav>
  );
}
