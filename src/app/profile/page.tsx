'use client';

import { useState } from 'react';
import ProfileMobile from './ProfileMobile';
import ProfileDesktop from './ProfileDesktop';
import LegalModal from '../components/LegalModal';
import styles from './page.module.css';

export default function ProfilePage() {
  const [legalOpen, setLegalOpen] = useState(false);

  return (
    <>
      <div className={styles.mobileOnly}>
        <ProfileMobile />
        <LegalModal
          isOpen={legalOpen}
          onClose={() => setLegalOpen(false)}
          initialDoc="terms"
          mode="view"
        />
      </div>

      <div className={styles.desktopOnly}>
        <ProfileDesktop />
      </div>
    </>
  );
}
