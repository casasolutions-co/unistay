'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppNav from '../components/AppNav';
import styles from './ProfileDesktop.module.css';

/* ── Helpers ── */
function initials(user: User): string {
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

function displayName(user: User): string {
  return user.displayName ?? user.email?.split('@')[0] ?? 'Account';
}

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Document upload state ── */
type DocStatus = 'not_started' | 'pending' | 'verified' | 'rejected';
type DocKey = 'enrolment' | 'income' | 'address';
interface DocState { status: DocStatus; fileName: string | null }

const DOC_META: Record<DocKey, { label: string; sub: string; icon: string; modalSub: string }> = {
  enrolment: {
    label: 'Proof of enrolment', sub: 'Upload current certificate',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4',
    modalSub: 'Upload a current certificate or letter confirming your enrolment.',
  },
  income: {
    label: 'Proof of income', sub: 'Payslip or bank statement — helps applications move faster',
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    modalSub: 'Upload a recent payslip or bank statement showing regular income.',
  },
  address: {
    label: 'Proof of address', sub: 'Utility bill or bank statement — optional',
    icon: 'M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1Z',
    modalSub: 'Upload a utility bill or bank statement issued within the last 3 months.',
  },
};

const DOC_STATUS_META: Record<DocStatus, { chip: string; chipClass: string; actionLabel: string }> = {
  not_started: { chip: '', chipClass: '', actionLabel: 'Upload document' },
  pending: { chip: 'Pending review', chipClass: 'chipPending', actionLabel: 'Replace file' },
  verified: { chip: 'Verified', chipClass: 'chipVerified', actionLabel: '' },
  rejected: { chip: 'Needs re-upload', chipClass: 'chipRejected', actionLabel: 'Re-upload' },
};

/* ── Main component ── */
export default function ProfileDesktop() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '+49 151 234 5678',
    org: 'LMU München',
    role: 'M.Sc. Computer Science',
    graduation: '2026',
  });
  const [docs, setDocs] = useState<Record<DocKey, DocState>>({
    enrolment: { status: 'not_started', fileName: null },
    income: { status: 'not_started', fileName: null },
    address: { status: 'not_started', fileName: null },
  });
  const [modalDoc, setModalDoc] = useState<DocKey | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        setForm(prev => ({ ...prev, fullName: u.displayName ?? '', email: u.email ?? '' }));
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user.getIdToken().then(token =>
      fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then((d: { user?: { verification_status?: string } }) => {
          if (!cancelled && d.user?.verification_status) setVerificationStatus(d.user.verification_status);
        })
        .catch(() => {})
    );
    return () => { cancelled = true; };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const userInitials = user ? initials(user) : '?';
  const userName = user ? displayName(user) : 'Account';

  const fields: { label: string; key: keyof typeof form; verified?: boolean }[] = [
    { label: 'Full name', key: 'fullName' },
    { label: 'Email address', key: 'email', verified: true },
    { label: 'Phone', key: 'phone', verified: true },
    { label: 'University', key: 'org', verified: true },
    { label: 'Programme', key: 'role' },
    { label: 'Expected graduation', key: 'graduation' },
  ];

  const idVerified = verificationStatus === 'verified';
  const idPending = verificationStatus === 'pending';
  const idSub = idVerified ? 'Verified with Didit' : idPending ? 'In review — usually a few minutes' : 'Via Didit — ID scan + selfie';

  const docKeys: DocKey[] = ['enrolment', 'income', 'address'];
  const verifiedDocCount = docKeys.filter(k => docs[k].status === 'verified').length;
  const verifiedCount = 2 + (idVerified ? 1 : 0) + verifiedDocCount;
  const totalCount = 2 + 1 + docKeys.length;

  const openModal = (key: DocKey) => { setModalDoc(key); setPendingFileName(null); };
  const closeModal = () => { setModalDoc(null); setPendingFileName(null); };
  const submitFile = () => {
    if (!modalDoc || !pendingFileName) return;
    setDocs(prev => ({ ...prev, [modalDoc]: { status: 'pending', fileName: pendingFileName } }));
    closeModal();
  };

  return (
    <div className={styles.page}>
      <AppNav />

      <div className={styles.inner}>
        <div className={styles.layout}>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <Link href="/settings" className={styles.backLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to settings
            </Link>

            <div className={styles.identityCard}>
              <div className={styles.avatarWrap}>
                <div className={styles.identityAvatar}>{userInitials}</div>
                <button type="button" className={styles.avatarEditBtn} aria-label="Change photo">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                </button>
              </div>
              <p className={styles.identityName}>{userName}</p>
              <p className={styles.identityOrg}>LMU München · Munich</p>
              {idVerified ? (
                <span className={styles.identityBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Verified student
                </span>
              ) : idPending ? (
                <span className={styles.identityBadge} style={{ background: '#fff7ed', color: '#b45309' }}>In review</span>
              ) : (
                <Link href="/verify" className={styles.identityBadge} style={{ background: '#f3effe', color: '#6d28d9' }}>Not verified — verify now</Link>
              )}

              <div className={styles.strengthBlock}>
                <div className={styles.strengthHeader}>
                  <span>Profile strength</span>
                  <span className={styles.strengthPct}>75%</span>
                </div>
                <div className={styles.strengthTrack}>
                  <div className={styles.strengthFill} style={{ width: '75%' }} />
                </div>
              </div>
            </div>

            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Log out
            </button>
          </aside>

          {/* Content */}
          <div className={styles.content}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Profile</h1>
              <button
                type="button"
                className={`${styles.editBtn} ${editing ? styles.editBtnActive : ''}`}
                onClick={() => setEditing(e => !e)}
              >
                <Icon d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" size={15} />
                {editing ? 'Done' : 'Edit profile'}
              </button>
            </div>

            {/* Personal information */}
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Personal information</h2>
              <div className={styles.fieldsGrid}>
                {fields.map(f => (
                  <div key={f.key}>
                    <label className={styles.fieldLabel}>{f.label}</label>
                    {editing ? (
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={form[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <div className={styles.fieldValue}>
                        {form[f.key] || '—'}
                        {f.verified && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1f8a5b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {editing && (
                <button type="button" className={styles.saveBtn} onClick={() => setEditing(false)}>
                  Save changes
                </button>
              )}
            </div>

            {/* Verification */}
            <div className={styles.panel}>
              <div className={styles.verifyHeader}>
                <div>
                  <h2 className={styles.panelTitle} style={{ marginBottom: 4 }}>Verification</h2>
                  <p className={styles.panelSub}>ID checks confirm who you are; documents below confirm your situation — each is reviewed separately.</p>
                </div>
                <span className={styles.verifyCount}>{verifiedCount}/{totalCount} complete</span>
              </div>

              <div className={styles.verifyList}>
                <div className={styles.verifyRow}>
                  <span className={styles.verifyIcon} style={{ background: '#e9f6ef', color: '#1f8a5b' }}>
                    <Icon d="M22 10 12 5 2 10l10 5 10-5ZM6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" size={18} />
                  </span>
                  <div className={styles.verifyBody}>
                    <div className={styles.verifyRowLabel}>Student email</div>
                    <div className={styles.verifyRowSub}>{user?.email || 'Not set'}</div>
                  </div>
                  <span className={styles.chipVerified}>Verified</span>
                </div>

                <div className={styles.verifyRow}>
                  <span className={styles.verifyIcon} style={{ background: '#e9f6ef', color: '#1f8a5b' }}>
                    <Icon d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.74-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92Z" size={18} />
                  </span>
                  <div className={styles.verifyBody}>
                    <div className={styles.verifyRowLabel}>Phone number</div>
                    <div className={styles.verifyRowSub}>Verified by SMS</div>
                  </div>
                  <span className={styles.chipVerified}>Verified</span>
                </div>

                <div className={styles.verifyRow}>
                  <span className={styles.verifyIcon} style={{ background: idVerified ? '#e9f6ef' : '#f3effe', color: idVerified ? '#1f8a5b' : '#6d28d9' }}>
                    <Icon d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM7 8h4M7 12h6M15 8h2M15 12h2" size={18} />
                  </span>
                  <div className={styles.verifyBody}>
                    <div className={styles.verifyRowLabel}>Government ID</div>
                    <div className={styles.verifyRowSub}>{idSub}</div>
                  </div>
                  {idVerified ? (
                    <span className={styles.chipVerified}>Verified</span>
                  ) : idPending ? (
                    <span className={styles.chipPending}>Pending review</span>
                  ) : (
                    <Link href="/verify" className={styles.verifyNowBtn}>Verify with Didit</Link>
                  )}
                </div>

                {docKeys.map(key => {
                  const meta = DOC_META[key];
                  const d = docs[key];
                  const statusMeta = DOC_STATUS_META[d.status];
                  const sub = d.status === 'not_started' ? meta.sub : (d.fileName || meta.sub);
                  return (
                    <div key={key} className={styles.verifyRow}>
                      <span className={styles.verifyIcon} style={{ background: '#f3effe', color: '#6d28d9' }}>
                        <Icon d={meta.icon} size={18} />
                      </span>
                      <div className={styles.verifyBody}>
                        <div className={styles.verifyRowLabel}>{meta.label}</div>
                        <div className={styles.verifyRowSub}>{sub}</div>
                      </div>
                      {statusMeta.chip && (
                        <span className={statusMeta.chipClass === 'chipPending' ? styles.chipPending : styles.chipRejected}>
                          {statusMeta.chip}
                        </span>
                      )}
                      {statusMeta.actionLabel && (
                        <button type="button" className={styles.verifyNowBtn} onClick={() => openModal(key)}>
                          {statusMeta.actionLabel}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload modal */}
      {modalDoc && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>{DOC_META[modalDoc].label}</span>
              <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="Close">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className={styles.modalSub}>{DOC_META[modalDoc].modalSub}</p>

            <label className={styles.dropZone} style={pendingFileName ? { borderColor: '#6d28d9', background: '#f7f4fd' } : undefined}>
              <span className={styles.dropIcon}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </span>
              {pendingFileName ? (
                <>
                  <span className={styles.dropTitle}>{pendingFileName}</span>
                  <span className={styles.dropSub}>Click to choose a different file</span>
                </>
              ) : (
                <>
                  <span className={styles.dropTitle}>Drop a file here or click to browse</span>
                  <span className={styles.dropSub}>PDF, JPG or PNG · up to 10 MB</span>
                </>
              )}
              <input
                type="file"
                className={styles.dropInput}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setPendingFileName(file.name);
                }}
              />
            </label>

            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancelBtn} onClick={closeModal}>Cancel</button>
              <button type="button" className={styles.modalSubmitBtn} disabled={!pendingFileName} onClick={submitFile}>
                Submit for review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
