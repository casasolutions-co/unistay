'use client';

import { useState } from 'react';
import SettingsMobile from './SettingsMobile';
import SettingsDesktop from './SettingsDesktop';
import LegalModal from '../components/LegalModal';
import styles from './page.module.css';

export default function SettingsPage() {
  const [legalOpen, setLegalOpen] = useState(false);

  return (
    <>
      <div className={styles.mobileOnly}>
        <SettingsMobile onOpenLegal={() => setLegalOpen(true)} />
      </div>
      <div className={styles.desktopOnly}>
        <SettingsDesktop onOpenLegal={() => setLegalOpen(true)} />
      </div>
      <LegalModal
        isOpen={legalOpen}
        onClose={() => setLegalOpen(false)}
        initialDoc="terms"
        mode="view"
      />
    </>
  );
}
