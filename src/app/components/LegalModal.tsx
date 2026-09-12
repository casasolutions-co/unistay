'use client';

import { useState, useEffect } from 'react';
import styles from './LegalModal.module.css';

interface Section {
  title: string;
  body: string;
}

interface DocContent {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}

const DOCS: Record<'terms' | 'privacy', DocContent> = {
  terms: {
    title: 'Terms of Service',
    updated: 'June 2026',
    intro: 'By creating an account or using UniStay, you agree to the terms below. Please read them carefully.',
    sections: [
      { title: 'Who we are', body: 'UniStay GmbH operates an online marketplace connecting students and young professionals with verified long-term housing across Germany. We are not a party to rental agreements between tenants and landlords.' },
      { title: 'Eligibility & account', body: 'You must be at least 18 and able to enter a binding contract. You are responsible for keeping your details accurate and your password secure.' },
      { title: 'Bookings & payments', body: 'Landlords are responsible for their listings. A request is confirmed only once the landlord accepts it and any required deposit is processed. Fees, where applicable, are shown before you confirm.' },
      { title: 'Cancellations', body: 'Cancellation terms are set per listing and shown at checkout. Refund eligibility depends on the landlord policy and how far in advance you cancel.' },
      { title: 'Conduct', body: 'Treat other users with respect. Discrimination, harassment, false listings, and off-platform payment circumvention are prohibited and may lead to suspension.' },
      { title: 'Liability & changes', body: 'The platform is provided “as is”. We are not liable for disputes arising from rental agreements. We may update these terms and will notify you of material changes.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'June 2026',
    intro: 'This policy explains what personal data we collect and how we use it, in line with the EU GDPR.',
    sections: [
      { title: 'What we collect', body: 'Account details (name, email, phone), profile information (nationality, university or employer), and any verification documents you choose to upload.' },
      { title: 'How we use it', body: 'To operate the platform, match you with suitable housing, process bookings and payments, prevent fraud, and improve our service.' },
      { title: 'Sharing', body: 'We share only necessary details with landlords you contact and with payment and verification partners. We never sell your personal data.' },
      { title: 'Cookies', body: 'We use essential cookies to run the site and, with your consent, analytics cookies to understand usage. You can manage preferences at any time.' },
      { title: 'Retention', body: 'We keep your data only as long as needed to provide the service and meet legal obligations, then delete or anonymise it.' },
      { title: 'Your rights', body: 'Under GDPR you can access, correct, export, or erase your data and object to certain processing. Email privacy@unistay.de to exercise these rights.' },
    ],
  },
};

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: 'terms' | 'privacy';
  mode?: 'agree' | 'view'; // 'agree' (Register flow) or 'view' (Login / link-click flow)
  onAgree?: () => void;
  isAgreed?: boolean;
}

export default function LegalModal({
  isOpen,
  onClose,
  initialDoc = 'terms',
  mode = 'view',
  onAgree,
  isAgreed = false,
}: LegalModalProps) {
  const [activeDoc, setActiveDoc] = useState<'terms' | 'privacy'>(initialDoc);
  const [showWarning, setShowWarning] = useState(false);
  const [localAgreed, setLocalAgreed] = useState(isAgreed);

  // Sync state if modal reopens or props change
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting a controlled modal's local state when it reopens; no render-time equivalent without a remount key
      setActiveDoc(initialDoc);
      setShowWarning(false);
      setLocalAgreed(isAgreed);
    }
  }, [isOpen, initialDoc, isAgreed]);

  if (!isOpen) return null;

  const currentDoc = DOCS[activeDoc];
  const isTerms = activeDoc === 'terms';

  const handleDecline = () => {
    setShowWarning(true);
  };

  const handleAgree = () => {
    setLocalAgreed(true);
    setShowWarning(false);
    if (onAgree) {
      onAgree();
    }
  };

  const agreeBg = localAgreed
    ? 'linear-gradient(180deg, #16a34a, #15803d)'
    : 'linear-gradient(180deg, #7c3aed, #6d28d9)';

  const agreeShadow = localAgreed
    ? '0 10px 22px -6px rgba(21,128,61,.5), inset 0 1px 0 rgba(255,255,255,.22)'
    : '0 10px 22px -6px rgba(109,40,217,.55), inset 0 1px 0 rgba(255,255,255,.22)';

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Mobile Handle indicator */}
        <div className={styles.mobileHandle} />

        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div>
              <p className={styles.eyebrow}>Legal</p>
              <h2 className={styles.title}>{currentDoc.title}</h2>
              <p className={styles.updated}>Last updated {currentDoc.updated}</p>
            </div>
            <span className={styles.requiredBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="11" width="16" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              Required
            </span>
          </div>

          {/* TABS */}
          <div className={styles.tabs}>
            <button
              type="button"
              onClick={() => setActiveDoc('terms')}
              className={styles.tabBtn}
              style={{
                color: isTerms ? '#1c1530' : '#8a8499',
                background: isTerms ? '#fff' : 'transparent',
                boxShadow: isTerms ? '0 1px 2px rgba(20,14,32,.12)' : 'none',
              }}
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveDoc('privacy')}
              className={styles.tabBtn}
              style={{
                color: !isTerms ? '#1c1530' : '#8a8499',
                background: !isTerms ? '#fff' : 'transparent',
                boxShadow: !isTerms ? '0 1px 2px rgba(20,14,32,.12)' : 'none',
              }}
            >
              Privacy Policy
            </button>
          </div>
        </div>

        {/* SCROLL BODY */}
        <div className={`${styles.scrollBody} us-scroll`}>
          <p className={styles.intro}>{currentDoc.intro}</p>
          {currentDoc.sections.map((section, idx) => {
            const numStr = String(idx + 1).padStart(2, '0');
            return (
              <div key={idx} className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionNum}>{numStr}</span>
                  {section.title}
                </h3>
                <p className={styles.sectionBody}>{section.body}</p>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          {mode === 'agree' ? (
            <>
              {showWarning && (
                <div className={styles.warnBox}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5M12 16.5v.01" />
                  </svg>
                  Accept the terms to finish creating your account.
                </div>
              )}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleDecline}
                  className={styles.declineBtn}
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleAgree}
                  className={styles.agreeBtn}
                  style={{
                    background: agreeBg,
                    boxShadow: agreeShadow,
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {localAgreed ? 'Accepted' : 'I Agree'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.closeBtn}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
