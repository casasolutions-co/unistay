'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import styles from '../page.module.css';
import CompleteProfileMobile from './CompleteProfileMobile';
import AppNav from '../../components/AppNav';

type Role = 'student' | 'employed' | null;

export default function CompleteProfile() {
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

  const studentRequired = role === 'student' ? university.trim() && program.trim() && startYear : true;
  const canSubmit = nationality && phone.trim() && role && studentRequired;

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
    <>
      <div className={styles.mobileOnly}>
        <CompleteProfileMobile />
      </div>
      <div className={styles.desktopOnly}>
    <div className={styles.page}>
      <AppNav />

      <div className={styles.split}>
        <div className={styles.imagePanel}>
          <div className={styles.imageBg} />
          <span className={styles.imagePhotoLabel}>[ photo — student flat interior ]</span>
          <div className={styles.imageContent}>
            <div className={styles.imageRule} />
            <h2 className={styles.imageHeadline}>Your profile, your story.</h2>
            <p className={styles.imageSub}>A complete profile helps landlords say yes — faster.</p>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formInner}>
            <p className={styles.eyebrow}>One more step</p>
            <h1 className={styles.headline}>Tell us about you</h1>
            <p className={styles.subline}>This helps landlords understand your situation.</p>

            <div className={styles.sectionLabel}>Required</div>

            <div className={styles.row}>
              <div className={styles.rowCol}>
                <label className={styles.label}>Nationality <span className={styles.required}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span className={styles.fieldIcon}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
                    </svg>
                  </span>
                  <select className={styles.select} value={nationality} onChange={e => setNationality(e.target.value)}
                    style={{ color: nationality ? 'var(--text)' : 'var(--placeholder)' }}>
                    <option value="">Select…</option>
                    <option>Germany</option><option>France</option><option>Spain</option>
                    <option>Italy</option><option>Netherlands</option><option>India</option>
                    <option>China</option><option>United States</option><option>Other</option>
                  </select>
                  <span className={styles.selectArrow}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </div>
              </div>
              <div className={styles.rowCol}>
                <label className={styles.label}>Phone <span className={styles.required}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <span className={styles.fieldIcon}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                    </svg>
                  </span>
                  <input type="tel" className={styles.field} placeholder="+49 …" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <label className={styles.label}>I am a <span className={styles.required}>*</span></label>
            <div className={styles.roleRow}>
              <button type="button" className={role === 'student' ? styles.roleBtnActive : styles.roleBtn} onClick={() => setRole('student')}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
                </svg>
                Student
              </button>
              <button type="button" className={role === 'employed' ? styles.roleBtnActive : styles.roleBtn} onClick={() => setRole('employed')}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Employed
              </button>
            </div>

            {role === 'student' && (
              <div>
                <label className={styles.label}>University <span className={styles.required}>*</span></label>
                <div className={styles.fieldWrap}>
                  <span className={styles.fieldIcon}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
                    </svg>
                  </span>
                  <input type="text" className={styles.field} placeholder="e.g. Technical University of Berlin"
                    value={university} onChange={e => setUniversity(e.target.value)} />
                </div>
                <div className={styles.row}>
                  <div className={styles.rowColWide}>
                    <label className={styles.label}>Program / Course <span className={styles.required}>*</span></label>
                    <input type="text" className={styles.fieldNoIcon} placeholder="e.g. MSc Computer Science"
                      value={program} onChange={e => setProgram(e.target.value)} />
                  </div>
                  <div className={styles.rowCol}>
                    <label className={styles.label}>Start year <span className={styles.required}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <select className={styles.selectNoIcon} value={startYear} onChange={e => setStartYear(e.target.value)}
                        style={{ color: startYear ? 'var(--text)' : 'var(--placeholder)' }}>
                        <option value="">Year…</option>
                        <option>2026</option><option>2025</option><option>2024</option>
                        <option>2023</option><option>2022</option><option>2021</option>
                      </select>
                      <span className={styles.selectArrow}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {role === 'employed' && (
              <div>
                <label className={styles.label}>What do you do? <span style={{ color: '#b3adbf', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <div className={styles.fieldWrap} style={{ marginBottom: 18 }}>
                  <span className={styles.fieldIcon}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </span>
                  <input type="text" className={styles.field} placeholder="e.g. Software Engineer at Siemens"
                    value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                </div>
              </div>
            )}

            {role && (
              <div>
                <div className={styles.optionalLabel}>Optional</div>
                <label className={styles.label}>Why UniStay?</label>
                <textarea className={styles.textarea} placeholder="Tell us why you're looking for housing…"
                  rows={3} value={why} onChange={e => setWhy(e.target.value)} />
              </div>
            )}

            {error && <p style={{ fontSize: 13, fontWeight: 600, color: '#c2557a', margin: '8px 0', textAlign: 'center' }}>{error}</p>}

            <button type="button" className={styles.createBtn} disabled={!canSubmit || loading} onClick={handleSubmit}
              style={{ marginTop: 20, width: '100%' }}>
              {loading ? 'Saving…' : 'Complete Profile'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
      </div>
    </>
  );
}
