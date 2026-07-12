'use client';

import MyListingsMobile from './MyListingsMobile';
import MyListingsDesktop from './MyListingsDesktop';
import styles from './page.module.css';

export default function MyListingsPage() {
  return (
    <>
      <div className={styles.mobileOnly}>
        <MyListingsMobile />
      </div>
      <div className={styles.desktopOnly}>
        <MyListingsDesktop />
      </div>
    </>
  );
}
