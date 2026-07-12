'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import AppNav from '../components/AppNav';
import DocumentsMobile from './DocumentsMobile';
import { useDocuments, DOC_TYPE_OPTIONS, formatSize } from './useDocuments';
import styles from './page.module.css';

function Icon({ paths, size = 18, stroke = 'currentColor', sw = 2 }: { paths: string[]; size?: number; stroke?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

function DocumentsDesktop() {
  const { documents, loading, uploading, error, upload, remove } = useDocuments();
  const [docType, setDocType] = useState(DOC_TYPE_OPTIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPendingFile(null);
    setDropdownOpen(false);
  };

  const handleSubmit = async () => {
    if (!pendingFile) return;
    const ok = await upload(pendingFile, docType);
    if (ok) setPendingFile(null);
  };

  return (
    <div className={styles.page}>
      <AppNav />
      <div className={styles.workspace}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Link href="/settings" className={styles.backLink}>
              <Icon size={14} sw={2.4} paths={['m15 18-6-6 6-6']} />
              Back to settings
            </Link>
            <div className={styles.breadcrumb}>Account &gt; Documents</div>
            <h1 className={styles.title}>Upload a document</h1>
            <p className={styles.subtitle}>Share a lease, insurance form, or other paperwork with your host. This is separate from identity verification.</p>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.dropdownWrap}>
              <div className={styles.fieldLabel}>Document type</div>
              <button type="button" className={styles.dropdownTrigger} onClick={() => setDropdownOpen(v => !v)}>
                <span>{docType}</span>
                <Icon size={16} sw={2.2} stroke="#6b6675" paths={['M6 9l6 6 6-6']} />
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

            <label
              className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) setPendingFile(f);
              }}
            >
              <span className={styles.dropIcon}>
                <Icon paths={['M12 16V4M6 10l6-6 6 6M4 20h16']} />
              </span>
              <span className={styles.dropTitle}>{pendingFile ? pendingFile.name : 'Drag & drop your file here'}</span>
              <span className={styles.dropSub}>{pendingFile ? 'Click to choose a different file' : 'PDF, JPG or PNG · up to 10MB'}</span>
              <button type="button" className={styles.browseBtn} onClick={() => fileInputRef.current?.click()}>Browse files</button>
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
                      <Icon size={17} paths={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6']} />
                    </span>
                    <div className={styles.docBody}>
                      <div className={styles.docName}>{doc.file_name}</div>
                      <div className={styles.docMeta}>{doc.doc_type} · {formatSize(doc.size_bytes)}</div>
                    </div>
                    <button type="button" className={styles.docRemoveBtn} onClick={() => remove(doc.id)} aria-label={`Remove ${doc.file_name}`}>
                      <Icon size={14} sw={2.3} paths={['M6 6l12 12M18 6L6 18']} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={styles.actionsRow}>
              <button type="button" className={styles.cancelBtn} onClick={reset}>Cancel</button>
              <button type="button" className={styles.submitBtn} disabled={!pendingFile || uploading} onClick={handleSubmit}>
                {uploading ? 'Uploading…' : 'Submit document'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <>
      <div className={styles.mobileOnly}>
        <DocumentsMobile />
      </div>
      <div className={styles.desktopOnly}>
        <DocumentsDesktop />
      </div>
    </>
  );
}
