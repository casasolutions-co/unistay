'use client';

import Link from 'next/link';
import { useVerifyFlow } from './useVerifyFlow';
import styles from './VerifyMobile.module.css';

function Icon({ paths, size = 17, stroke = 'currentColor', sw = 1.8 }: { paths: string[]; size?: number; stroke?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const RIGHTS = [
  {
    title: 'Scan your ID document',
    desc: 'Passport, national ID, or residence permit — read by camera, not stored by UniStay.',
    paths: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M7 8h4M7 12h6M15 8h2M15 12h2'],
  },
  {
    title: 'Take a quick selfie',
    desc: 'Camera access is used once to match your face to your ID (liveness check).',
    paths: ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'M9.5 10.5v.01M14.5 10.5v.01', 'M9 14c.7.7 1.8 1 3 1s2.3-.3 3-1'],
  },
  {
    title: 'Share basic details with Didit',
    desc: 'Name, date of birth, and document number, sent securely to verify against issuing records.',
    paths: ['M20 21a8 8 0 1 0-16 0', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  },
  {
    title: 'Result sent back to UniStay',
    desc: 'We only receive a verified / not-verified result — Didit keeps the document.',
    paths: ['M9 12l2 2 4-4', 'M21 12a9 9 0 1 1-9-9c2.5 0 4.7 1 6.4 2.6'],
  },
];

export default function VerifyMobile() {
  const {
    stage, consent, setConsent,
    checkingPending, stillPendingNotice, redirectError,
    canSubmit, submitId, refreshPending, goBack, goConsent,
  } = useVerifyFlow();

  const isFormStage = stage === 'consent';
  const headerTitle = stage === 'consent' ? 'Verify with Didit' : '';

  return (
    <div className={styles.page}>

      {/* APP BAR */}
      <div className={styles.appBar}>
        {isFormStage ? (
          <button type="button" onClick={goBack} className={styles.roundBtn}>
            <Icon size={17} sw={2.3} paths={['m15 18-6-6 6-6']} />
          </button>
        ) : (
          <Link href="/settings" className={styles.roundBtn}>
            <Icon size={15} sw={2.4} paths={['M18 6 6 18M6 6l12 12']} />
          </Link>
        )}
        <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{headerTitle}</span>
        <a href="#" style={{ flex: 'none', width: 38, textAlign: 'right', fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Help</a>
      </div>

      {/* SCROLL CONTENT */}
      <div className={`${styles.usScroll} ${styles.scroll}`}>

        {stage === 'intro' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 74, height: 74, borderRadius: '50%', background: '#f3effe', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
                <Icon size={34} sw={1.8} stroke="#6d28d9" paths={['M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3Z', 'm9 12 2 2 4-4']} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--brand)', margin: '0 0 8px' }}>Account verification</p>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 25, lineHeight: 1.14, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Verify your identity to list a place</h1>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-muted)', margin: '12px 0 0' }}>For everyone&apos;s safety, hosts confirm who they are before publishing. We use Didit, a trusted identity-verification partner, to do this in a couple of minutes.</p>
            </div>

            <button
              type="button"
              onClick={goConsent}
              style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', padding: 16, borderRadius: 16, border: '1.5px solid #e6e2ef', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <span style={{ flex: 'none', width: 42, height: 42, borderRadius: 12, background: '#f3effe', display: 'grid', placeItems: 'center', color: 'var(--brand)' }}>
                <Icon size={19} sw={2} paths={['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M7 8h4M7 12h6M15 8h2M15 12h2']} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--text)' }}>Verify with Didit</span>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-soft)', marginTop: 2 }}>ID scan + quick selfie · usually done in minutes</span>
              </span>
              <Icon size={18} sw={2.2} stroke="#c4bdd2" paths={['m9 18 6-6-6-6']} />
            </button>

            <p style={{ fontSize: 11.5, color: '#b0aabf', fontWeight: 600, textAlign: 'center', margin: '20px 0 0' }}>Your documents are encrypted and only ever used to verify your account.</p>
          </div>
        )}

        {stage === 'consent' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: '#f7f4fd', border: '1px solid #ece4fb', marginBottom: 18 }}>
              <span style={{ flex: 'none', width: 32, height: 32, borderRadius: 9, background: 'var(--text)', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>D</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4a2c8f', lineHeight: 1.4 }}>Verification is handled by <strong>Didit</strong>, our identity-verification partner — not by UniStay directly.</span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px' }}>Before you continue, here&apos;s what Didit will ask for and why:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {RIGHTS.map(r => (
                <div key={r.title} style={{ display: 'flex', gap: 12, padding: '13px 14px', borderRadius: 14, border: '1.5px solid #e6e2ef', background: '#fff' }}>
                  <span style={{ flex: 'none', width: 36, height: 36, borderRadius: 10, background: '#f3effe', display: 'grid', placeItems: 'center', color: 'var(--brand)' }}>
                    <Icon paths={r.paths} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{r.title}</span>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-soft)', marginTop: 2, lineHeight: 1.4 }}>{r.desc}</span>
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setConsent(v => !v)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 0 4px', fontFamily: 'inherit' }}
            >
              <span style={{ flex: 'none', width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${consent ? 'var(--brand)' : '#d8d2e6'}`, background: consent ? 'var(--brand)' : '#fff', display: 'grid', placeItems: 'center', marginTop: 1 }}>
                {consent && <Icon size={13} sw={3} stroke="#fff" paths={['M20 6 9 17l-5-5']} />}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#4a4654', lineHeight: 1.5 }}>
                I agree to share my ID and a live photo with Didit for verification, per Didit&apos;s <a href="#" style={{ color: 'var(--brand)' }}>Privacy Policy</a> and UniStay&apos;s <a href="#" style={{ color: 'var(--brand)' }}>Terms</a>.
              </span>
            </button>
          </div>
        )}

        {stage === 'redirecting' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span className={styles.spinner} style={{ marginBottom: 22 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, margin: 0, color: 'var(--text)' }}>Opening Didit securely…</h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '10px 0 0', maxWidth: 260 }}>You&apos;ll finish your ID scan and selfie there, then land back here automatically.</p>
          </div>
        )}

        {stage === 'pending' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 86, height: 86, margin: '0 auto 22px' }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--brand)', opacity: .16, animation: 'usPing 2.6s cubic-bezier(0,0,.2,1) infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(180deg, #f3effe, #ede4ff)', display: 'grid', placeItems: 'center', animation: 'usFloat 4s ease-in-out infinite' }}>
                <Icon size={38} sw={1.7} stroke="#6d28d9" paths={['M12 8v4l3 3', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z']} />
              </div>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 25, lineHeight: 1.1, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Didit is reviewing your ID</h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-muted)', margin: '10px 0 0' }}>This usually takes a few minutes, occasionally up to 24 hours. We&apos;ll notify you the moment it&apos;s done.</p>

            <div style={{ textAlign: 'left', background: '#fff', border: '1px solid #efecf5', borderRadius: 16, padding: 16, margin: '20px 0 0' }}>
              {[['Method', 'Didit · ID + selfie'], ['Submitted', 'Just now']].map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: i ? '1px solid #f3f1f8' : 'none' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #f3f1f8' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)' }}>Status</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b45309', background: '#fff7ed', padding: '4px 11px', borderRadius: 999 }}>In review</span>
              </div>
            </div>

            <button
              type="button"
              onClick={refreshPending}
              style={{ width: '100%', height: 50, marginTop: 18, border: 'none', borderRadius: 13, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 22px -6px rgba(109,40,217,.5), inset 0 1px 0 rgba(255,255,255,.22)' }}
            >
              {checkingPending ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'usSpin .7s linear infinite' }} />
                  Checking…
                </>
              ) : 'Refresh status'}
            </button>

            {stillPendingNotice && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '11px 14px', background: '#fff7ed', border: '1px solid #fde0c2', borderRadius: 12, fontWeight: 600, fontSize: 13, color: '#b45309', textAlign: 'left' }}>
                <Icon size={15} sw={2.2} paths={['M12 8v5M12 16.5v.01']} />
                Still in review — thanks for your patience. Check back a little later.
              </div>
            )}
          </div>
        )}

        {stage === 'verified' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 92, height: 92, borderRadius: '50%', background: '#ecfdf3', display: 'grid', placeItems: 'center', margin: '0 auto 24px', animation: 'usPop .4s ease' }}>
              <Icon size={46} sw={2.4} stroke="#15803d" paths={['M20 6 9 17l-5-5']} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1.08, letterSpacing: '-.03em', margin: 0, color: 'var(--text)' }}>You&apos;re verified!</h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-muted)', margin: '12px 0 26px' }}>You can publish listings on UniStay whenever you&apos;re ready.</p>
            <Link
              href="/list"
              style={{ width: '100%', height: 54, borderRadius: 14, textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 22px -6px rgba(109,40,217,.55), inset 0 1px 0 rgba(255,255,255,.22)' }}
            >
              Continue to list your place
              <Icon size={18} sw={2.4} paths={['M5 12h14M13 6l6 6-6 6']} />
            </Link>
            <Link href="/settings" style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textDecoration: 'none' }}>Back to Settings</Link>
          </div>
        )}

      </div>

      {/* STICKY CTA (consent stage) */}
      {stage === 'consent' && (
        <div className={styles.stickyCta}>
          <button
            type="button"
            onClick={submitId}
            disabled={!canSubmit}
            style={{ width: '100%', height: 54, border: 'none', borderRadius: 14, cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: canSubmit ? 1 : .5, fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 22px -6px rgba(109,40,217,.55), inset 0 1px 0 rgba(255,255,255,.22)' }}
          >
            Continue to Didit
            <Icon size={17} sw={2.3} paths={['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14 21 3']} />
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#b0aabf', margin: '10px 0 0' }}>You&apos;ll be redirected to Didit to complete verification securely.</p>
          {redirectError && (
            <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#c2453f', margin: '8px 0 0' }}>{redirectError}</p>
          )}
        </div>
      )}
    </div>
  );
}
