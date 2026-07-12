'use client';

import HelpCenterMobile from './HelpCenterMobile';
import HelpContactDesktop from '../components/HelpContactDesktop';
import styles from './page.module.css';

export default function HelpCenterPage() {
  return (
    <>
      <div className={styles.mobileOnly}>
        <HelpCenterMobile />
      </div>
      <div className={styles.desktopOnly}>
        <HelpContactDesktop />
      </div>
    </>
  );
}
