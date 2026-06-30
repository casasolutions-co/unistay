'use client';

import ProfileMobile from '../ProfileMobile';
import styles from '../page.module.css';

export default function EditProfilePage() {
  return (
    <div className={styles.mobileOnly}>
      <ProfileMobile />
    </div>
  );
}
