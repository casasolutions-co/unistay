'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from '../RegisterMobile.module.css';
import { COUNTRIES, START_YEARS } from '@/lib/profileOptions';
import { withNext } from '@/lib/nextPath';
import {
  type Role, type LandlordInfo, EMPTY_LANDLORD, missingFields, MissingHint, afterSignupPath,
  landlordPayload, Spinner, RoleCards, LandlordFields, useNeedsName,
} from '../signupShared';

const IArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IChevDown = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function CompleteProfileMobile() {
  const router = useRouter();
  const needsName = useNeedsName();
  const [name, setName] = useState('');
  const [landlord, setLandlord] = useState<LandlordInfo>(EMPTY_LANDLORD);
  const [role, setRole] = useState<Role>(null);
  const [nationality, setNationality] = useState('');
  const [phone, setPhone] = useState('');
  const [residenceCountry, setResidenceCountry] = useState('');
  const [residenceCity, setResidenceCity] = useState('');
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('');
  const [startYear, setStartYear] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [why, setWhy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const missing = missingFields({
    name: needsName ? name : undefined, nationality, phone, residenceCountry, residenceCity, role, university, program, startYear,
  });
  const canSubmit = missing.length === 0;

  useEffect(() => { router.prefetch(afterSignupPath(role)); }, [router, role]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) { router.push('/login'); return; }
      const token = await user.getIdToken();
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: needsName ? name.trim() : user.displayName,
          phone, nationality, residenceCountry, residenceCity,
          role: role === 'employed' ? 'student' : role,
          university, program, startYear, jobTitle, why, ...landlordPayload(role, landlord),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      if (needsName) await updateProfile(user, { displayName: name.trim() });
      router.push(withNext(afterSignupPath(role)));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>

      {/* Banner */}
      <div className={styles.photoBanner}>
        <div className={styles.bannerContent} style={{ paddingTop: 48 }}>
          <div className={styles.logoRow}>
            <Image src="/primary-logo.png" alt="UniStay" width={2049} height={1772} style={{ height: 40, width: 'auto', filter: 'brightness(0) invert(1)' }} priority />
          </div>
          <h1 className={styles.bannerTitle}>{role === 'landlord' ? 'Rent to verified tenants.' : 'Your profile, your story.'}</h1>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <div className={styles.handle} />
        </div>

        <div className={styles.scrollContent}>
          <h2 className={styles.step2Title}>One more step</h2>
          <p className={styles.step2Sub}>
            {role === 'landlord' ? 'So tenants know who they’re renting from.' : 'This helps landlords understand your situation.'}
          </p>

          <label className={styles.label}>I am a *</label>
          <RoleCards role={role} onChange={setRole} styles={styles} />

          {needsName && (
            <>
              <label className={styles.label}>Full name *</label>
              <input type="text" className={styles.field} placeholder="Jane Smith" autoComplete="name"
                value={name} onChange={e => setName(e.target.value)} />
            </>
          )}

          {/* Nationality + Phone */}
          <div className={styles.twoCol}>
            <div className={styles.twoColItem}>
              <label className={styles.label}>Nationality *</label>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  style={{ color: nationality ? 'var(--text)' : 'var(--placeholder)' }}
                >
                  <option value="">Select…</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <span className={styles.selectArrow}><IChevDown /></span>
              </div>
            </div>
            <div className={styles.twoColItem}>
              <label className={styles.label}>Phone *</label>
              <input
                type="tel"
                className={styles.fieldMb0}
                placeholder="+49 …"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Residence */}
          <div className={styles.twoCol}>
            <div className={styles.twoColItem}>
              <label className={styles.label}>Country of residence *</label>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={residenceCountry}
                  onChange={e => setResidenceCountry(e.target.value)}
                  style={{ color: residenceCountry ? 'var(--text)' : 'var(--placeholder)' }}
                >
                  <option value="">Select…</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <span className={styles.selectArrow}><IChevDown /></span>
              </div>
            </div>
            <div className={styles.twoColItem}>
              <label className={styles.label}>City *</label>
              <input
                type="text"
                className={styles.fieldMb0}
                placeholder="Where you live now"
                value={residenceCity}
                onChange={e => setResidenceCity(e.target.value)}
              />
            </div>
          </div>

          {/* Student fields */}
          {role === 'student' && (
            <div>
              <label className={styles.label}>University *</label>
              <input type="text" className={styles.field} placeholder="e.g. TU Berlin"
                value={university} onChange={e => setUniversity(e.target.value)} />
              <div className={styles.twoCol}>
                <div className={styles.twoColWide}>
                  <label className={styles.label}>Program *</label>
                  <input type="text" className={styles.fieldMb0} placeholder="MSc CS"
                    value={program} onChange={e => setProgram(e.target.value)} />
                </div>
                <div className={styles.twoColItem}>
                  <label className={styles.label}>Start year *</label>
                  <div className={styles.selectWrap}>
                    <select className={styles.select} value={startYear} onChange={e => setStartYear(e.target.value)}
                      style={{ color: startYear ? 'var(--text)' : 'var(--placeholder)' }}>
                      <option value="">Year…</option>
                      {START_YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                    <span className={styles.selectArrowBottom}><IChevDown /></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employed fields */}
          {role === 'employed' && (
            <div>
              <label className={styles.label}>What do you do? <span className={styles.optional}>(optional)</span></label>
              <input type="text" className={styles.field} placeholder="e.g. Software Engineer at Siemens"
                value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
            </div>
          )}

          {role === 'landlord' && (
            <LandlordFields value={landlord} onChange={setLandlord} styles={styles} fieldClass={styles.field} />
          )}

          {/* Optional why — tenant-facing, so not for landlords */}
          {role && role !== 'landlord' && (
            <div>
              <label className={styles.label}>Why UniStay? <span className={styles.optional}>(optional)</span></label>
              <textarea className={styles.textarea} placeholder="Tell us what you're looking for…"
                rows={2} value={why} onChange={e => setWhy(e.target.value)} />
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div className={styles.ctaArea}>
          {error && <p className={styles.errorBox} role="alert">{error}</p>}
          <button type="button" className={styles.ctaBtn} disabled={!canSubmit || loading} onClick={handleSubmit}>
            {loading ? <>Saving… <Spinner styles={styles} /></> : <>Complete Profile <IArrow /></>}
          </button>
          {!canSubmit && !loading && (role ? <MissingHint missing={missing} styles={styles} /> : <p className={styles.hint}>Pick who you are to continue</p>)}
        </div>
      </div>
    </div>
  );
}
