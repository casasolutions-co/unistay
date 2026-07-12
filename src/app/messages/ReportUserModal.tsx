'use client';

import { useState } from 'react';

const REASONS = [
  'Spam or scam',
  'Fake listing',
  'Inappropriate messages',
  'Harassment or threats',
  'Other',
];

interface Props {
  targetName: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function ReportUserModal({ targetName, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const needsDetails = selected === 'Other';
  const canSubmit = !!selected && (!needsDetails || details.trim().length > 0) && !submitting;

  const handleSubmit = () => {
    if (!canSubmit || !selected) return;
    setSubmitting(true);
    const reason = needsDetails ? details.trim() : selected;
    onSubmit(reason);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,14,32,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1c1530', margin: '0 0 8px' }}>Report {targetName}</h3>
        <p style={{ fontSize: 13.5, color: '#6b6478', lineHeight: 1.5, margin: '0 0 18px' }}>
          Why are you reporting this conversation? Our team will review it.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: needsDetails ? 14 : 22 }}>
          {REASONS.map(reason => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelected(reason)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                padding: '11px 14px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13.5, fontWeight: 600, color: '#1c1530',
                border: `1.5px solid ${selected === reason ? '#6d28d9' : '#e6e2ef'}`,
                background: selected === reason ? '#f7f4fd' : '#fff',
              }}
            >
              <span style={{
                flex: 'none', width: 18, height: 18, borderRadius: '50%',
                border: `1.5px solid ${selected === reason ? '#6d28d9' : '#d8d2e6'}`,
                background: selected === reason ? '#6d28d9' : 'transparent',
              }} />
              {reason}
            </button>
          ))}
        </div>

        {needsDetails && (
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Tell us what happened…"
            rows={3}
            style={{
              width: '100%', resize: 'vertical', marginBottom: 22, padding: '10px 12px',
              borderRadius: 11, border: '1.5px solid #e6e2ef', fontFamily: 'inherit',
              fontSize: 13.5, color: '#1c1530',
            }}
          />
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, height: 44, borderRadius: 11, border: '1px solid #e6e2ef', background: '#fff', color: '#6b6675', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              flex: 1, height: 44, borderRadius: 11, border: 'none', color: '#fff',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
              cursor: canSubmit ? 'pointer' : 'not-allowed', opacity: canSubmit ? 1 : 0.5,
              background: 'linear-gradient(180deg, #7c3aed, #6d28d9)',
            }}
          >
            {submitting ? 'Reporting…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  );
}
