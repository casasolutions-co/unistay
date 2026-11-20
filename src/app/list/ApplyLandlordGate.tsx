'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from 'firebase/auth';
import LegalModal from '@/app/components/LegalModal';
import {
  RENTAL_TYPES, LISTING_COUNTS, DECLARATIONS, LANDLORD_TERMS_VERSION,
  RentalType, ListingCount, DeclarationKey,
} from '@/lib/landlordApplication';
import styles from './ApplyLandlordGate.module.css';

export type LandlordStatus = 'none' | 'pending' | 'approved' | 'rejected';

// Latest saved answers, as returned by GET /api/user/apply-landlord.
export type SavedApplication = {
  rentalType: RentalType;
  listingCount: ListingCount;
  phone: string;
  companyName: string | null;
  companyWebsite: string | null;
  submittedAt: number;
};

function Icon({ paths, size = 17, sw = 2 }: { paths: string[]; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

const COUNT_LABEL: Record<ListingCount, string> = { '1': '1', '2-5': '2–5', '6+': '6+' };

// Shown in place of the "List your place" form until the current user is an
// admin-approved landlord. Sits behind the identity-verification gate
// (../verify/page.tsx); status/note/saved come from the parent's single fetch.
export default function ApplyLandlordGate({
  user, status, note, saved, onApplied,
}: {
  user: User;
  status: Exclude<LandlordStatus, 'approved'>;
  note: string | null;
  saved: SavedApplication | null;
  onApplied: (status: LandlordStatus, application: SavedApplication | null) => void;
}) {
  const [editing, setEditing] = useState(status === 'none');
  const [rentalType, setRentalType] = useState<RentalType>(saved?.rentalType ?? 'owner');
  const [listingCount, setListingCount] = useState<ListingCount>(saved?.listingCount ?? '1');
  const [phone, setPhone] = useState(saved?.phone ?? '');
  const [companyName, setCompanyName] = useState(saved?.companyName ?? '');
  const [companyWebsite, setCompanyWebsite] = useState(saved?.companyWebsite ?? '');
  const [declared, setDeclared] = useState<Set<DeclarationKey>>(new Set());
  const [terms, setTerms] = useState(false);
  const [legalOpen, setLegalOpen] = useState<'terms' | 'privacy' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const left = DECLARATIONS.length - declared.size + (terms ? 0 : 1);
  const canSubmit = left === 0 && phone.trim() !== '' && (rentalType !== 'agency' || (companyName.trim() !== '' && companyWebsite.trim() !== ''));

  function toggle(key: DeclarationKey) {
    setDeclared(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user/apply-landlord', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalType, listingCount, phone, companyName, companyWebsite,
          declarations: [...declared], termsVersion: terms ? LANDLORD_TERMS_VERSION : null,
        }),
      });
      const data = await res.json() as { landlordStatus?: LandlordStatus; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not submit application');
      setEditing(false);
      onApplied(data.landlordStatus ?? 'pending', {
        rentalType, listingCount, phone: phone.trim(),
        companyName: rentalType === 'agency' ? companyName.trim() : null,
        companyWebsite: rentalType === 'agency' ? companyWebsite.trim() : null,
        submittedAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application');
    } finally {
      setSubmitting(false);
    }
  }

  const showForm = status === 'none' || editing;
  const dotCls = (s: 'done' | 'now' | 'next') => `${styles.dot} ${s === 'done' ? styles.dotDone : s === 'now' ? styles.dotNow : styles.dotNext}`;
  const check = <Icon size={12} sw={3.2} paths={['M20 6 9 17l-5-5']} />;

  return (
    <div className={styles.page}>
      <div className={styles.grid}>

        {/* ===== LEFT: CONTEXT ===== */}
        <aside className={styles.ctx}>
          <div className={styles.ctxBadge}>
            <Icon size={28} sw={1.8} paths={['M3 10.5 12 3l9 7.5', 'M5 9.5V20h14V9.5', 'M10 20v-5h4v5']} />
          </div>
          <p className={styles.eyebrow}>Become a landlord</p>
          <h1 className={styles.ctxTitle}>List your place on UniStay</h1>
          <p className={styles.ctxText}>We review every landlord before their first listing goes live. This keeps scams away from students, and it takes about a minute.</p>
          <div className={styles.steps}>
            <div className={styles.step}><span className={dotCls('done')}>{check}</span>Profile complete</div>
            <div className={styles.step}><span className={dotCls('done')}>{check}</span>Identity verified with Didit</div>
            <div className={styles.step}>
              <span className={dotCls(showForm ? 'now' : 'done')}>{showForm ? '3' : check}</span>Landlord application
            </div>
            <div className={styles.step}><span className={dotCls('next')}>4</span>List your first place</div>
          </div>
        </aside>

        {/* ===== RIGHT: CARD ===== */}
        <div className={styles.card}>
          {showForm ? (
            <>
              <div className={styles.cardHead}>
                <span className={styles.cardHeadTitle}>Landlord application</span>
                <span className={styles.cardHeadMeta}>~1 min</span>
              </div>
              <form className={styles.cardBody} onSubmit={submit} noValidate>
                {status === 'rejected' && note && <p className={styles.reason} style={{ margin: 0, maxWidth: 'none' }}>Last time: {note}</p>}

                <div className={styles.q}>
                  <span className={styles.qTitle}>How do you rent out?</span>
                  <div className={styles.opts}>
                    {RENTAL_TYPES.map(t => (
                      <button key={t.value} type="button" aria-pressed={rentalType === t.value}
                        className={`${styles.opt} ${rentalType === t.value ? styles.optOn : ''}`}
                        onClick={() => setRentalType(t.value)}>
                        <b>{t.title}</b><span>{t.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {rentalType === 'sublet' && (
                  <div className={styles.note}>
                    <span style={{ flex: 'none', marginTop: 1 }}><Icon size={16} sw={2.2} paths={['M12 8v5M12 16.5v.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z']} /></span>
                    Subletting needs your main landlord’s written permission. We may ask to see it.
                  </div>
                )}

                {rentalType === 'agency' && (
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="ll-company">Company name</label>
                      <input id="ll-company" className={styles.input} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Muster Immobilien GmbH" maxLength={120} autoComplete="organization" />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="ll-website">Website</label>
                      <input id="ll-website" type="url" className={styles.input} value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="https://" maxLength={200} autoComplete="url" />
                    </div>
                  </div>
                )}

                <div className={styles.q}>
                  <span className={styles.qTitle}>How many places will you list?</span>
                  <div className={styles.chips}>
                    {LISTING_COUNTS.map(c => (
                      <button key={c} type="button" aria-pressed={listingCount === c}
                        className={`${styles.chip} ${listingCount === c ? styles.chipOn : ''}`}
                        onClick={() => setListingCount(c)}>{COUNT_LABEL[c]}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.q}>
                  <label className={styles.qTitle} htmlFor="ll-phone">Phone number</label>
                  <p className={styles.qHint}>Only our team sees this. We use it if we need to check something.</p>
                  <input id="ll-phone" type="tel" className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 151 23456789" maxLength={24} autoComplete="tel" />
                </div>

                <div className={styles.decl}>
                  <span className={styles.qTitle} style={{ marginBottom: 4 }}>I confirm that</span>
                  {DECLARATIONS.map(d => {
                    const on = declared.has(d.key);
                    return (
                      <button key={d.key} type="button" role="checkbox" aria-checked={on} className={styles.check} onClick={() => toggle(d.key)}>
                        <span className={`${styles.box} ${on ? styles.boxOn : ''}`}>{on && check}</span>
                        <span><span className={styles.checkTitle}>{d.title}</span><span className={styles.checkSub}>{d.sub}</span></span>
                      </button>
                    );
                  })}
                  <div className={styles.check} style={{ cursor: 'default' }}>
                    <button type="button" role="checkbox" aria-checked={terms} aria-label="I agree to the Terms and Privacy Policy"
                      className={`${styles.box} ${terms ? styles.boxOn : ''}`} style={{ cursor: 'pointer', padding: 0 }}
                      onClick={() => setTerms(v => !v)}>{terms && check}</button>
                    <span className={styles.checkTitle}>
                      I agree to the <button type="button" className={styles.link} onClick={() => setLegalOpen('terms')}>Terms</button> and <button type="button" className={styles.link} onClick={() => setLegalOpen('privacy')}>Privacy Policy</button>
                    </span>
                  </div>
                </div>

                <div className={styles.foot}>
                  <button type="submit" className={styles.btn} disabled={!canSubmit || submitting}>
                    {submitting ? 'Submitting…' : 'Submit application'}
                    {!submitting && <Icon size={16} sw={2.4} paths={['M5 12h14M13 6l6 6-6 6']} />}
                  </button>
                  <span className={styles.footHint}>
                    {left > 0 ? `${left} confirmation${left > 1 ? 's' : ''} left` : 'We’ll let you know once it’s reviewed.'}
                  </span>
                </div>
                {error && <p className={styles.error}>{error}</p>}
              </form>
            </>
          ) : status === 'pending' ? (
            <div className={styles.cardBody}>
              <div className={styles.center}>
                <div className={styles.halo} style={{ background: 'linear-gradient(180deg, #f3effe, #ede4ff)', color: 'var(--brand)' }}>
                  <Icon size={36} sw={1.7} paths={['M12 8v4l3 3', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z']} />
                </div>
                <h2 className={styles.stateTitle}>We’re reviewing your application</h2>
                <p className={styles.stateText}>We’ll let you know as soon as it’s decided. You can close this page in the meantime.</p>
                {saved && (
                  <div className={styles.summary}>
                    <div className={styles.sumRow}><span className={styles.sumKey}>Renting as</span><span className={styles.sumVal}>{RENTAL_TYPES.find(t => t.value === saved.rentalType)?.sub}</span></div>
                    {saved.companyName && <div className={styles.sumRow}><span className={styles.sumKey}>Company</span><span className={styles.sumVal}>{saved.companyName}</span></div>}
                    <div className={styles.sumRow}><span className={styles.sumKey}>Places</span><span className={styles.sumVal}>{COUNT_LABEL[saved.listingCount]}</span></div>
                    <div className={styles.sumRow}><span className={styles.sumKey}>Submitted</span><span className={styles.sumVal}>{new Date(saved.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                    <div className={styles.sumRow}><span className={styles.sumKey}>Status</span><span className={styles.pill}>In review</span></div>
                  </div>
                )}
                <Link href="/" className={styles.home}>Back to home</Link>
              </div>
            </div>
          ) : (
            <div className={styles.cardBody}>
              <div className={styles.center}>
                <div className={styles.halo} style={{ background: '#fdf0f3', color: '#b4324f' }}>
                  <Icon size={34} sw={2} paths={['M15 9l-6 6M9 9l6 6', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z']} />
                </div>
                <h2 className={styles.stateTitle}>Your application wasn’t approved</h2>
                <p className={styles.stateText}>{note ? 'Here’s what our team said. Fix it and apply again.' : 'You can update your answers and apply again.'}</p>
                {note && <p className={styles.reason}>{note}</p>}
                <button type="button" className={styles.btn} style={{ marginTop: 22 }} onClick={() => setEditing(true)}>Edit and re-apply</button>
                <Link href="/" className={styles.home}>Back to home</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <LegalModal isOpen={legalOpen !== null} onClose={() => setLegalOpen(null)} initialDoc={legalOpen ?? 'terms'} mode="view" />
    </div>
  );
}
