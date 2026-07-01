'use client';

import Link from 'next/link';
import VerifyMobile from './VerifyMobile';
import { useVerifyFlow } from './useVerifyFlow';
import styles from './page.module.css';

function Icon({ paths, size = 18, stroke = 'currentColor', sw = 1.8 }: { paths: string[]; size?: number; stroke?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const WHY_LIST = [
  'Confirms hosts are who they say they are',
  'Reduces fraudulent or fake listings',
  'Builds trust with students booking a place to live',
];

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

export default function VerifyIdentity() {
  const {
    stage, consent, setConsent,
    checkingPending, stillPendingNotice, redirectError,
    canSubmit, submitId, refreshPending, goBack, goConsent, resubmit,
  } = useVerifyFlow();

  const isFormStage = stage === 'consent';
  const headerTitle = stage === 'consent' ? 'Verify with Didit' : '';

  return (
    <>
      <div className={styles.mobileOnly}>
        <VerifyMobile />
      </div>
      <div className={styles.desktopOnly}>
        <div className={styles.page}>
          <div className={styles.workspace}>
            <div className={styles.grid}>

              {/* ===== LEFT: CONTEXT PANEL ===== */}
              <div className={styles.contextPanel}>
                <div style={{ width: 62, height: 62, borderRadius: 18, background: '#f3effe', display: 'grid', placeItems: 'center', marginBottom: 20 }}>
                  <Icon size={30} stroke="#6d28d9" sw={1.7} paths={['M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3Z', 'm9 12 2 2 4-4']} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--brand)', margin: '0 0 10px' }}>Account verification</p>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1.14, letterSpacing: '-.025em', margin: '0 0 14px', color: 'var(--text)' }}>Verify your identity to list a place</h1>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--text-muted)', margin: '0 0 26px', maxWidth: 320 }}>For everyone&apos;s safety, hosts confirm who they are before publishing a listing. We use Didit, a trusted identity-verification partner, to do this in just a couple of minutes.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {WHY_LIST.map(w => (
                    <div key={w} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ flex: 'none', width: 20, height: 20, borderRadius: '50%', background: '#ecfdf3', display: 'grid', placeItems: 'center', color: '#15803d', marginTop: 1 }}>
                        <Icon size={11} sw={3.2} paths={['M20 6 9 17l-5-5']} />
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#4a4654', lineHeight: 1.5 }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== RIGHT: STAGE CARD ===== */}
              <div className={styles.card}>

                {isFormStage && (
                  <div className={styles.cardHeader}>
                    <button type="button" onClick={goBack} className={styles.backBtn}>
                      <Icon size={16} sw={2.3} paths={['m15 18-6-6 6-6']} />
                    </button>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>{headerTitle}</span>
                  </div>
                )}

                <div className={styles.cardBody}>

                  {stage === 'intro' && (
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, letterSpacing: '-.01em', margin: '0 0 8px', color: 'var(--text)' }}>Ready when you are</h2>
                      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 24px', maxWidth: 460 }}>Verification takes about 2 minutes: a scan of your government ID and a quick selfie, handled securely by Didit.</p>

                      <button
                        type="button"
                        onClick={goConsent}
                        style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', textAlign: 'left', padding: '20px 22px', borderRadius: 16, border: '1.5px solid #e6e2ef', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        <span style={{ flex: 'none', width: 48, height: 48, borderRadius: 13, background: '#f3effe', display: 'grid', placeItems: 'center', color: 'var(--brand)' }}>
                          <Icon size={22} sw={2} paths={['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M7 8h4M7 12h6M15 8h2M15 12h2']} />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: 15.5, fontWeight: 700, color: 'var(--text)' }}>Verify with Didit</span>
                          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--text-soft)', marginTop: 3 }}>ID scan + quick selfie · usually done in minutes</span>
                        </span>
                        <Icon size={19} sw={2.2} stroke="#c4bdd2" paths={['m9 18 6-6-6-6']} />
                      </button>

                      <p style={{ fontSize: 12, color: '#b0aabf', fontWeight: 600, margin: '20px 0 0' }}>Your documents are encrypted and only ever used to verify your account.</p>
                    </div>
                  )}

                  {stage === 'consent' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: '#f7f4fd', border: '1px solid #ece4fb', marginBottom: 22 }}>
                        <span style={{ flex: 'none', width: 34, height: 34, borderRadius: 9, background: 'var(--text)', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>D</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#4a2c8f', lineHeight: 1.4 }}>Verification is handled by <strong>Didit</strong>, our identity-verification partner — not by UniStay directly.</span>
                      </div>

                      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 16px' }}>Before you continue, here&apos;s what Didit will ask for and why:</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                        {RIGHTS.map(r => (
                          <div key={r.title} style={{ display: 'flex', gap: 12, padding: 15, borderRadius: 14, border: '1.5px solid #e6e2ef', background: '#fff' }}>
                            <span style={{ flex: 'none', width: 38, height: 38, borderRadius: 10, background: '#f3effe', display: 'grid', placeItems: 'center', color: 'var(--brand)' }}>
                              <Icon paths={r.paths} />
                            </span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{r.title}</span>
                              <span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-soft)', marginTop: 3, lineHeight: 1.45 }}>{r.desc}</span>
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setConsent(v => !v)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '2px 0 4px', fontFamily: 'inherit' }}
                      >
                        <span style={{ flex: 'none', width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${consent ? 'var(--brand)' : '#d8d2e6'}`, background: consent ? 'var(--brand)' : '#fff', display: 'grid', placeItems: 'center', marginTop: 1 }}>
                          {consent && <Icon size={13} sw={3} stroke="#fff" paths={['M20 6 9 17l-5-5']} />}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#4a4654', lineHeight: 1.55 }}>
                          I agree to share my ID and a live photo with Didit for verification, per Didit&apos;s <a href="#" style={{ color: 'var(--brand)' }}>Privacy Policy</a> and UniStay&apos;s <a href="#" style={{ color: 'var(--brand)' }}>Terms</a>.
                        </span>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, paddingTop: 24, borderTop: '1px solid #f1eef7' }}>
                        <button
                          type="button"
                          onClick={submitId}
                          disabled={!canSubmit}
                          style={{ height: 48, padding: '0 26px', border: 'none', borderRadius: 13, cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: canSubmit ? 1 : .5, fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 22px -6px rgba(109,40,217,.4), inset 0 1px 0 rgba(255,255,255,.22)' }}
                        >
                          Continue to Didit
                          <Icon size={16} sw={2.3} paths={['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', 'M15 3h6v6', 'M10 14 21 3']} />
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#b0aabf' }}>You&apos;ll be redirected to Didit to finish verification securely.</span>
                      </div>
                      {redirectError && (
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: '#c2453f', margin: '14px 0 0' }}>{redirectError}</p>
                      )}
                    </div>
                  )}

                  {stage === 'redirecting' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px 0' }}>
                      <span className={styles.spinner} style={{ marginBottom: 22 }} />
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, margin: 0, color: 'var(--text)' }}>Opening Didit securely…</h2>
                      <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '10px 0 0', maxWidth: 320 }}>You&apos;ll finish your ID scan and selfie there, then land back here automatically.</p>
                    </div>
                  )}

                  {stage === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
                      <div style={{ position: 'relative', width: 84, height: 84, marginBottom: 22 }}>
                        <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--brand)', opacity: .16, animation: 'usPing 2.6s cubic-bezier(0,0,.2,1) infinite' }} />
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(180deg, #f3effe, #ede4ff)', display: 'grid', placeItems: 'center', animation: 'usFloat 4s ease-in-out infinite' }}>
                          <Icon size={36} sw={1.7} stroke="#6d28d9" paths={['M12 8v4l3 3', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z']} />
                        </div>
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Didit is reviewing your ID</h2>
                      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)', margin: '10px 0 0', maxWidth: 360 }}>This usually takes a few minutes, occasionally up to 24 hours. We&apos;ll notify you the moment it&apos;s done.</p>

                      <div style={{ width: '100%', maxWidth: 380, textAlign: 'left', background: '#faf9fc', border: '1px solid #efecf5', borderRadius: 14, padding: '16px 18px', margin: '22px 0 0' }}>
                        {[
                          ['Method', 'Didit · ID + selfie'],
                          ['Submitted', 'Just now'],
                        ].map(([k, v], i) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: i ? '1px solid #f0edf7' : 'none' }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)' }}>{k}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{v}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #f0edf7' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)' }}>Status</span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b45309', background: '#fff7ed', padding: '4px 11px', borderRadius: 999 }}>In review</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={refreshPending}
                        style={{ marginTop: 20, height: 46, padding: '0 24px', border: 'none', borderRadius: 13, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 22px -6px rgba(109,40,217,.4), inset 0 1px 0 rgba(255,255,255,.22)' }}
                      >
                        {checkingPending ? (
                          <>
                            <span style={{ width: 15, height: 15, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'usSpin .7s linear infinite' }} />
                            Checking…
                          </>
                        ) : 'Refresh status'}
                      </button>

                      {stillPendingNotice && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '11px 14px', background: '#fff7ed', border: '1px solid #fde0c2', borderRadius: 12, fontWeight: 600, fontSize: 13, color: '#b45309', textAlign: 'left' }}>
                          <Icon size={15} sw={2.2} paths={['M12 8v5M12 16.5v.01']} />
                          Still in review — thanks for your patience. Check back a little later.
                        </div>
                      )}
                    </div>
                  )}

                  {stage === 'rejected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
                      <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#fdeeee', display: 'grid', placeItems: 'center', marginBottom: 22 }}>
                        <Icon size={36} sw={1.8} stroke="#d2453f" paths={['M12 8v5', 'M12 16.5v.01', 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z']} />
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-.02em', margin: 0, color: 'var(--text)' }}>Didit couldn&apos;t verify that ID</h2>
                      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-muted)', margin: '10px 0 0' }}>Something didn&apos;t check out. Here&apos;s what to fix:</p>

                      <div style={{ display: 'flex', gap: 10, textAlign: 'left', background: '#fff7ed', border: '1px solid #fde0c2', borderRadius: 14, padding: '14px 16px', margin: '18px 0 0', maxWidth: 400 }}>
                        <Icon size={16} sw={2.2} stroke="#b45309" paths={['M12 9v4', 'M12 16.5v.01', 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z']} />
                        <span style={{ fontSize: 12.5, lineHeight: 1.55, color: '#92400e', fontWeight: 600 }}>The photo was too blurry to read, or the selfie didn&apos;t match the document. Please retry in good lighting.</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => { resubmit(); }}
                        style={{ marginTop: 22, height: 48, padding: '0 28px', border: 'none', borderRadius: 13, cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#fff', background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 22px -6px rgba(109,40,217,.4), inset 0 1px 0 rgba(255,255,255,.22)' }}
                      >
                        Try again with Didit
                      </button>
                    </div>
                  )}

                  {stage === 'verified' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
                      <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#ecfdf3', display: 'grid', placeItems: 'center', marginBottom: 24, animation: 'usPop .4s ease' }}>
                        <Icon size={44} sw={2.4} stroke="#15803d" paths={['M20 6 9 17l-5-5']} />
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-.025em', margin: 0, color: 'var(--text)' }}>You&apos;re verified!</h2>
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)', margin: '12px 0 26px', maxWidth: 340 }}>You can publish listings on UniStay whenever you&apos;re ready.</p>
                      <Link
                        href="/list"
                        style={{ height: 50, padding: '0 30px', borderRadius: 13, textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', boxShadow: '0 10px 22px -6px rgba(109,40,217,.45), inset 0 1px 0 rgba(255,255,255,.22)' }}
                      >
                        Continue to list your place
                        <Icon size={17} sw={2.4} paths={['M5 12h14M13 6l6 6-6 6']} />
                      </Link>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
