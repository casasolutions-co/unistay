'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import styles from '../RegisterMobile.module.css';

type Role = 'student' | 'employed' | null;

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

const IStudent = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
  </svg>
);

const IEmployed = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function CompleteProfileMobile() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [nationality, setNationality] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('');
  const [startYear, setStartYear] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [why, setWhy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const studentReq = role === 'student' ? !!(university.trim() && program.trim() && startYear) : true;
  const canSubmit = !!(nationality && phone.trim() && role && studentReq);

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
          name: user.displayName,
          phone, nationality,
          role: role === 'employed' ? 'student' : role,
          university, program, startYear, jobTitle, why,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      router.push('/search');
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
          <h1 className={styles.bannerTitle}>Your profile, your story.</h1>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className={styles.sheet}>
        <div className={styles.sheetHeader}>
          <div className={styles.handle} />
        </div>

        <div className={styles.scrollContent}>
          <h2 className={styles.step2Title}>One more step</h2>
          <p className={styles.step2Sub}>This helps landlords understand your situation.</p>

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
                  <option>Germany</option>
                  <option>France</option>
                  <option>Spain</option>
                  <option>Italy</option>
                  <option>Netherlands</option>
                  <option>India</option>
                  <option>China</option>
                  <option>United States</option>
                  <option>Other</option>
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

          {/* Role */}
          <label className={styles.label}>I am a *</label>
          <div className={styles.roleRow}>
            <button type="button" className={role === 'student' ? styles.roleBtnActive : styles.roleBtn} onClick={() => setRole('student')}>
              <IStudent /> Student
            </button>
            <button type="button" className={role === 'employed' ? styles.roleBtnActive : styles.roleBtn} onClick={() => setRole('employed')}>
              <IEmployed /> Employed
            </button>
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
                  <label className={styles.label}>Year *</label>
                  <div className={styles.selectWrap}>
                    <select className={styles.select} value={startYear} onChange={e => setStartYear(e.target.value)}
                      style={{ color: startYear ? 'var(--text)' : 'var(--placeholder)' }}>
                      <option value="">Year…</option>
                      <option>2026</option><option>2025</option><option>2024</option>
                      <option>2023</option><option>2022</option>
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

          {/* Optional why */}
          {role && (
            <div>
              <label className={styles.label}>Why UniStay? <span className={styles.optional}>(optional)</span></label>
              <textarea className={styles.textarea} placeholder="Tell us what you're looking for…"
                rows={2} value={why} onChange={e => setWhy(e.target.value)} />
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div className={styles.ctaArea}>
          {error && <p style={{ fontSize: 13, fontWeight: 600, color: '#c2557a', margin: '0 0 10px', textAlign: 'center' }}>{error}</p>}
          <button type="button" className={styles.ctaBtn} disabled={!canSubmit || loading} onClick={handleSubmit}>
            {loading ? 'Saving…' : 'Complete Profile'}
            <IArrow />
          </button>
        </div>
      </div>
    </div>
  );
}
