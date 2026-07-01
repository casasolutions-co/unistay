'use client';

import styles from './MobileWhenFields.module.css';
import { FLEX_OPTS, FLEXWIN_OPTS, todayStr, type WhenPicker } from '@/lib/useWhenPicker';

/**
 * Mode tabs (By date / By month / Flexible) + the fields for each mode.
 * Shared between the mobile hero search card and the mobile search-results
 * filter sheet — both use the same UI, driven by a `useWhenPicker()` controller.
 */
export default function MobileWhenFields({ c }: { c: WhenPicker }) {
  return (
    <>
      <div className={styles.sheetTabs}>
        {(['date', 'month', 'flexible'] as const).map(tab => {
          const active = tab === c.mode;
          const labels = { date: 'By date', month: 'By month', flexible: 'Flexible' };
          return (
            <button
              key={tab}
              type="button"
              className={styles.sheetTab}
              style={{
                background: active ? 'linear-gradient(180deg, #7c3aed, #6d28d9)' : 'transparent',
                color: active ? '#fff' : '#4a3d6b',
                boxShadow: active ? '0 6px 14px -4px rgba(109,40,217,.45)' : 'none',
              }}
              onClick={() => c.setMode(tab)}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <div className={styles.sheetBody}>
        {c.mode === 'date' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label className={styles.fieldLabel}>Move-in</label>
              <input
                type="date"
                value={c.moveIn}
                min={todayStr()}
                onChange={e => c.setMoveIn(e.target.value)}
                className={styles.dateInput}
              />
            </div>

            <button
              type="button"
              className={styles.noEndToggle}
              style={{
                borderColor: c.noEndDate ? '#6d28d9' : 'var(--border)',
                background: c.noEndDate ? '#f3effe' : '#fff',
              }}
              onClick={() => c.toggleNoEnd()}
            >
              <span
                className={styles.noEndCheckbox}
                style={{
                  borderColor: c.noEndDate ? '#6d28d9' : '#d4cfe0',
                  background: c.noEndDate ? '#6d28d9' : '#fff',
                }}
              >
                {c.noEndDate && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className={styles.noEndLabel}>No end date yet — I&apos;ll figure out move-out later</span>
            </button>

            {!c.noEndDate && (
              <div style={{ marginBottom: 14 }}>
                <label className={styles.fieldLabel}>Move-out</label>
                <input
                  type="date"
                  value={c.moveOut}
                  min={c.moveIn || todayStr()}
                  onChange={e => c.setMoveOut(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            )}

            <div className={styles.fieldLabel} style={{ marginBottom: 9 }}>Flexibility</div>
            <div className={styles.chipRow}>
              {FLEX_OPTS.map(f => {
                const active = c.flex === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className={styles.flexChip}
                    style={{
                      color: active ? '#6d28d9' : '#4a3d6b',
                      background: active ? '#f3effe' : '#fff',
                      borderColor: active ? '#6d28d9' : 'var(--border)',
                    }}
                    onClick={() => c.setFlex(f.key)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {c.mode === 'month' && (
          <>
            <label className={styles.fieldLabel}>Move-in month</label>
            <div className={styles.monthSelectWrap}>
              <select
                value={c.selectedMonth}
                onChange={e => c.setSelectedMonth(e.target.value)}
                className={styles.monthSelect}
              >
                {c.monthOptions.map(mo => (
                  <option key={mo.value} value={mo.value}>{mo.label}</option>
                ))}
              </select>
              <span className={styles.monthSelectChevron}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>

            <div className={styles.fieldLabel} style={{ marginBottom: 10 }}>How long will you stay?</div>
            <div className={styles.stayRow}>
              <span className={styles.stayLabel}>{c.stayMonths === 1 ? 'Month' : 'Months'}</span>
              <div className={styles.stayStepper}>
                <button type="button" className={styles.stepperBtn} onClick={() => c.setStayMonths(m => Math.max(1, m - 1))}>−</button>
                <div className={styles.stepperValue}>{c.stayMonths}</div>
                <button type="button" className={styles.stepperBtn} onClick={() => c.setStayMonths(m => Math.min(24, m + 1))}>+</button>
              </div>
            </div>
          </>
        )}

        {c.mode === 'flexible' && (
          <div className={styles.flexPanel}>
            <div className={styles.flexIconWrap}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18" /><path d="M8 3v4M16 3v4" />
              </svg>
            </div>
            <div className={styles.flexTitle}>Not sure about your dates yet?</div>
            <div className={styles.flexSub}>No problem — tell us roughly when, and we&apos;ll show places open to flexible or unlimited stays.</div>
            <div className={styles.chipRow} style={{ justifyContent: 'center' }}>
              {FLEXWIN_OPTS.map(f => {
                const active = c.flexWindow === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className={styles.flexChip}
                    style={{
                      color: active ? '#6d28d9' : '#4a3d6b',
                      background: active ? '#f3effe' : '#fff',
                      borderColor: active ? '#6d28d9' : 'var(--border)',
                    }}
                    onClick={() => c.setFlexWindow(f.key)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
