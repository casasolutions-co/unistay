import styles from './Footer.module.css';

const STUDENT_LINKS = ['Refer and Earn', 'Become an Ambassador', 'Success Stories', 'Careers'];
const PARTNER_LINKS = ['Become an Agent', 'Partner with Us'];
const LEGAL_LINKS = ['Imprint', 'Privacy Policy'];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div>
            <div className={styles.heading}>Casa Solutions</div>
            <div className={styles.row}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.rowIconTop}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className={styles.rowText}>Hallstraße 1a<br />92318 Neumarkt in der Oberpfalz, Germany</span>
            </div>
            <div className={styles.row}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.rowIcon}>
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c1 .3 2 .5 3 .6a2 2 0 0 1 1.7 2Z" />
              </svg>
              <span className={styles.rowTextInline}>+49 179 1449246</span>
            </div>
            <div className={styles.row}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.rowIcon}>
                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 6 10 7 10-7" />
              </svg>
              <a href="mailto:info@unistay.de" className={styles.rowLink}>info@unistay.de</a>
            </div>
          </div>

          <div>
            <div className={styles.heading}>For Students</div>
            <div className={styles.linkCol}>
              {STUDENT_LINKS.map(l => <a key={l} href="#" className={styles.link}>{l}</a>)}
            </div>
          </div>

          <div>
            <div className={styles.heading}>For Partners</div>
            <div className={styles.linkCol}>
              {PARTNER_LINKS.map(l => <a key={l} href="#" className={styles.link}>{l}</a>)}
            </div>
          </div>

          <div>
            <div className={styles.heading}>Legal</div>
            <div className={styles.linkCol}>
              {LEGAL_LINKS.map(l => <a key={l} href="#" className={styles.link}>{l}</a>)}
            </div>
          </div>

          <div>
            <div className={styles.heading}>Follow Us</div>
            <div className={styles.socialRow}>
              <span className={styles.socialIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span className={styles.socialIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="6" /><circle cx="12" cy="12" r="4.5" /><circle cx="17.3" cy="6.7" r="1" />
                </svg>
              </span>
              <span className={styles.socialIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9.5" /><path d="M10 9.2v5.6l4.8-2.8Z" fill="currentColor" stroke="none" />
                </svg>
              </span>
            </div>
            <div className={styles.badge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e0a63c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" /><path d="m9 13.5-1.5 7L12 18l4.5 2.5-1.5-7" />
              </svg>
              <span className={styles.badgeText}>ICEF Accredited Agent</span>
            </div>
          </div>
        </div>

        <div className={styles.divider} />
        <div className={styles.copyright}>© 2026 CASA Solutions. All rights reserved.</div>
      </div>
    </footer>
  );
}
