'use client';

import ProfileMobile from './ProfileMobile';
import styles from './page.module.css';

export default function ProfilePage() {
  return (
    <div className={styles.mobileOnly}>
      <ProfileMobile />
    </div>
  );
}
