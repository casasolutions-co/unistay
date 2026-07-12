'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileTabBar from '../components/MobileTabBar';
import { useDocuments, DOC_TYPE_OPTIONS, formatSize } from './useDocuments';
import styles from './DocumentsMobile.module.css';

function Icon({ paths, size = 18, stroke = 'currentColor', sw = 2 }: { paths: string[]; size?: number; stroke?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

export default function DocumentsMobile() {
  const router = useRouter();
  const { documents, loading, uploading, error, upload, remove } = useDocuments();
  const [docType, setDocType] = useState(DOC_TYPE_OPTIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!pendingFile) return;
    const ok = await upload(pendingFile, docType);
    if (ok) setPendingFile(null);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => router.push('/settings')} aria-label="Back">
          <Icon size={20} sw={2.2} paths={['M15 18l-6-6 6-6']} />
        </button>
        <span className={styles.headerTitle}>Upload document</span>
      </div>

      <div className={styles.body}>
        <p className={styles.subtitle}>Share a lease, insurance form, or other paperwork with your host. This is separate from identity verification.</p>

        <div className={styles.fieldLabel}>Document type</div>
        <div className={styles.dropdownWrap}>
          <button type="button" className={styles.dropdownTrigger} onClick={() => setDropdownOpen(v => !v)}>
            <span>{docType}</span>
            <Icon size={15} sw={2.2} stroke="#6b6675" paths={['M6 9l6 6 6-6']} />
          </button>
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              {DOC_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={styles.dropdownOption}
                  onClick={() => { setDocType(opt); setDropdownOpen(false); }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className={styles.dropzone}>
          <span className={styles.dropIcon}>
            <Icon size={21} paths={['M12 16V4M6 10l6-6 6 6M4 20h16']} />
          </span>
          <span className={styles.dropTitle}>{pendingFile ? pendingFile.name : 'Tap to upload a file'}</span>
          <span className={styles.dropSub}>{pendingFile ? 'Tap to choose a different file' : 'PDF, JPG or PNG · up to 10MB'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) setPendingFile(f);
              e.target.value = '';
            }}
          />
        </label>

        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.fieldLabel}>Uploaded</div>
        <div className={styles.uploadedList}>
          {loading ? (
            <p className={styles.emptyState}>Loading…</p>
          ) : documents.length === 0 ? (
            <p className={styles.emptyState}>No documents uploaded yet.</p>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className={styles.docRow}>
                <span className={styles.docIcon}>
                  <Icon size={15} paths={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6']} />
                </span>
                <div className={styles.docBody}>
                  <div className={styles.docName}>{doc.file_name}</div>
                  <div className={styles.docMeta}>{doc.doc_type} · {formatSize(doc.size_bytes)}</div>
                </div>
                <button type="button" className={styles.docRemoveBtn} onClick={() => remove(doc.id)} aria-label={`Remove ${doc.file_name}`}>
                  <Icon size={12} sw={2.3} paths={['M6 6l12 12M18 6L6 18']} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.submitBtn} disabled={!pendingFile || uploading} onClick={handleSubmit}>
          {uploading ? 'Uploading…' : 'Submit document'}
        </button>
      </div>

      <MobileTabBar active="profile" />
    </div>
  );
}
