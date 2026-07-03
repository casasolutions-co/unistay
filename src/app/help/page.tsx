'use client';

import HelpCenterMobile from './HelpCenterMobile';
import styles from './page.module.css';

export default function HelpCenterPage() {
  return (
    <div className={styles.mobileOnly}>
      <HelpCenterMobile />
    </div>
  );
}
