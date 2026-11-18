'use client';

import { useId, useState } from 'react';
import { usePlaceSearch, type Place } from '@/lib/usePlaceSearch';

/**
 * The listing form's "Street name" input, with address suggestions.
 * Picking one fills street, number, city and postcode in one go (all stay
 * editable); typing without picking behaves like a plain input.
 */
export default function StreetAutocomplete({ value, city, onChange, onPick, className, style }: {
  value: string;
  city: string;
  onChange: (v: string) => void;
  onPick: (p: Place) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  // Bias towards the city already entered, if any.
  const places = usePlaceSearch(`${value} ${city}`, 'address', open && value.trim().length >= 3);

  return (
    <>
      <input
        type="text"
        placeholder="Start typing your street…"
        value={value}
        autoComplete="off"
        role="combobox"
        aria-controls={listId}
        aria-expanded={open && places.length > 0}
        aria-autocomplete="list"
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
        className={className}
        style={style}
      />
      {open && places.length > 0 && (
        <div id={listId} role="listbox" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200, background: '#fff', border: '1.5px solid #e6e2ef', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.12)', overflow: 'hidden' }}>
          {places.map(p => (
            <button key={p.label} type="button" role="option" aria-selected={false}
              // mousedown + preventDefault so the input's blur doesn't close the list first
              onMouseDown={e => { e.preventDefault(); onPick(p); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#1c1530', textAlign: 'left', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8f6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9a94a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
