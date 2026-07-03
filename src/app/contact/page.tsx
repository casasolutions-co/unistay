'use client';

import ContactSupportMobile from './ContactSupportMobile';
import ContactSupportDesktop from './ContactSupportDesktop';
import styles from './page.module.css';

export default function ContactSupportPage() {
  return (
    <>
      <div className={styles.mobileOnly}>
        <ContactSupportMobile />
      </div>
      <div className={styles.desktopOnly}>
        <ContactSupportDesktop />
      </div>
    </>
  );
}
