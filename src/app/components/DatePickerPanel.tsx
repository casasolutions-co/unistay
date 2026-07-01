'use client';

import { useState, useRef } from 'react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Mo','Tu','We','Th','Fr','Sa','Su'];

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }

function todayStr() {
  const t = new Date();
  return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
}

function currentMonthKey() {
  const t = new Date();
  return t.getFullYear() + '-' + pad(t.getMonth() + 1);
}

type Cell = { blank: true; key: string } | { blank: false; key: string; day: number; ds: string; disabled: boolean; isStart: boolean; isEnd: boolean; inRange: boolean; isToday: boolean };

interface CalMonth {
  title: string;
  weeks: { key: string; cells: Cell[] }[];
}

function buildMonth(offset: number, moveIn: string | null, moveOut: string | null, today: string): CalMonth {
  const t = new Date();
  let year = t.getFullYear();
  let month0 = t.getMonth() + offset;
  year += Math.floor(month0 / 12);
  month0 = ((month0 % 12) + 12) % 12;
  const first = new Date(year, month0, 1);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells: Cell[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ blank: true, key: `b${offset}-${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = year + '-' + pad(month0 + 1) + '-' + pad(d);
    cells.push({
      blank: false, key: ds, day: d, ds,
      disabled: ds < today,
      isStart: ds === moveIn,
      isEnd: !!moveOut && ds === moveOut,
      inRange: !!(moveIn && moveOut) && ds > moveIn && ds < moveOut,
      isToday: ds === today,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ blank: true, key: `e${offset}-${cells.length}` });
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push({ key: `w${offset}-${i}`, cells: cells.slice(i, i + 7) });
  return { title: MONTH_NAMES[month0] + ' ' + year, weeks };
}

interface Props {
  initialMoveIn?: string;
  initialMoveOut?: string;
  onApply: (moveIn: string, moveOut: string, label: string) => void;
  onClear: () => void;
}

export default function DatePickerPanel({ initialMoveIn = '', initialMoveOut = '', onApply, onClear }: Props) {
  const [mode, setMode] = useState<'date' | 'month'>('date');
  const [monthOffset, setMonthOffset] = useState(0);
  const [moveIn, setMoveIn] = useState<string | null>(initialMoveIn || null);
  const [moveOut, setMoveOut] = useState<string | null>(initialMoveOut || null);
  const [flex, setFlex] = useState<'exact' | '1week' | '2weeks'>('exact');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [stayMonths, setStayMonths] = useState(3);
  const stripRef = useRef<HTMLDivElement>(null);

  const today = todayStr();

  function handleDayClick(ds: string) {
    if (!moveIn || (moveIn && moveOut)) {
      setMoveIn(ds); setMoveOut(null);
    } else if (ds === moveIn) {
      setMoveIn(null); setMoveOut(null);
    } else if (ds < moveIn) {
      setMoveOut(moveIn); setMoveIn(ds);
    } else {
      setMoveOut(ds);
    }
  }

  function fmtNice(ds: string | null) {
    if (!ds) return '';
    const p = ds.split('-');
    return parseInt(p[2], 10) + ' ' + ABBR[parseInt(p[1], 10) - 1];
  }

  function handleApply() {
    if (mode === 'date') {
      const mi = moveIn ?? '';
      const mo = moveOut ?? '';
      let label = 'Add dates';
      if (mi && mo) label = fmtNice(mi) + ' – ' + fmtNice(mo);
      else if (mi) label = 'From ' + fmtNice(mi);
      onApply(mi, mo, label);
    } else if (mode === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const inDate = selectedMonth + '-01';
      let outY = y, outM = m - 1 + stayMonths;
      outY += Math.floor(outM / 12);
      outM = outM % 12;
      const outDate = outY + '-' + pad(outM + 1) + '-01';
      const label = ABBR[m - 1] + ' ' + y + ' · ' + stayMonths + (stayMonths === 1 ? ' month' : ' months');
      onApply(inDate, outDate, label);
    }
  }

  function handleClear() {
    setMoveIn(null); setMoveOut(null);
    setFlex('exact'); setSelectedMonth(currentMonthKey());
    setStayMonths(3);
    onClear();
  }

  const left = buildMonth(monthOffset, moveIn, moveOut, today);
  const right = buildMonth(monthOffset + 1, moveIn, moveOut, today);

  const openEnded = !!moveIn && !moveOut;

  // Month cards (14 months from now)
  const monthCards = (() => {
    const t = new Date();
    const cards = [];
    for (let i = 0; i < 14; i++) {
      let m = t.getMonth() + i;
      const yr = t.getFullYear() + Math.floor(m / 12);
      m = ((m % 12) + 12) % 12;
      const key = yr + '-' + pad(m + 1);
      cards.push({ key, label: ABBR[m], year: yr, selected: key === selectedMonth });
    }
    return cards;
  })();

  const FLEX_OPTS = [
    { key: 'exact', label: 'Exact dates' },
    { key: '1week', label: '± 1 week' },
    { key: '2weeks', label: '± 2 weeks' },
  ] as const;

  return (
    <div style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f3effe', borderRadius: 999, padding: 4, marginBottom: 6 }}>
        {(['date', 'month'] as const).map(tab => {
          const active = tab === mode;
          const labels = { date: 'By date', month: 'By month' };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              style={{
                flex: 1, border: 'none', padding: '10px 0', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                background: active ? 'linear-gradient(180deg, #7c3aed, #6d28d9)' : 'transparent',
                color: active ? '#fff' : '#4a3d6b',
                boxShadow: active ? '0 6px 14px -4px rgba(109,40,217,.45)' : 'none',
                transition: 'all .15s',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── BY DATE ── */}
      {mode === 'date' && (
        <div>
          <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
            {/* Left calendar */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setMonthOffset(o => Math.max(0, o - 1))}
                  disabled={monthOffset <= 0}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #e6e2ef',
                    background: '#fff', display: 'grid', placeItems: 'center',
                    cursor: monthOffset <= 0 ? 'not-allowed' : 'pointer',
                    opacity: monthOffset <= 0 ? 0.4 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={monthOffset <= 0 ? '#cfc8dd' : '#6d28d9'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#1c1530' }}>{left.title}</span>
                <span style={{ width: 28 }} />
              </div>
              <CalendarGrid weeks={left.weeks} onDayClick={handleDayClick} />
            </div>

            {/* Right calendar */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ width: 28 }} />
                <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#1c1530' }}>{right.title}</span>
                <button
                  type="button"
                  onClick={() => setMonthOffset(o => o + 1)}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #e6e2ef', background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
              <CalendarGrid weeks={right.weeks} onDayClick={handleDayClick} />
            </div>
          </div>

          {openEnded && (
            <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 600, color: '#6d28d9', background: '#f3effe', borderRadius: 10, padding: '9px 12px' }}>
              Open-ended stay — pick another date for a move-out, or apply with just a move-in date.
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {FLEX_OPTS.map(f => {
              const active = flex === f.key;
              return (
                <button key={f.key} type="button" onClick={() => setFlex(f.key)} style={{
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  color: active ? '#6d28d9' : '#4a3d6b',
                  background: active ? '#f3effe' : '#fff',
                  border: `1.5px solid ${active ? '#6d28d9' : '#e6e2ef'}`,
                  padding: '7px 13px', borderRadius: 999, cursor: 'pointer', transition: 'all .14s',
                }}>
                  {f.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMoveOut(null)}
              disabled={!moveIn}
              style={{
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                color: openEnded ? '#6d28d9' : (!moveIn ? '#cfc8dd' : '#4a3d6b'),
                background: openEnded ? '#f3effe' : '#fff',
                border: `1.5px dashed ${openEnded ? '#6d28d9' : '#e6e2ef'}`,
                padding: '7px 13px', borderRadius: 999, cursor: !moveIn ? 'default' : 'pointer',
                opacity: !moveIn ? 0.55 : 1, transition: 'all .14s',
              }}
            >
              No end date
            </button>
          </div>
        </div>
      )}

      {/* ── BY MONTH ── */}
      {mode === 'month' && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#1c1530', marginBottom: 14 }}>
            When&apos;s the move-in?
          </div>
          <div style={{ position: 'relative' }}>
            <div
              ref={stripRef}
              style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 4, scrollbarWidth: 'none' }}
            >
              {monthCards.map(mc => (
                <button
                  key={mc.key}
                  type="button"
                  onClick={() => setSelectedMonth(mc.key)}
                  style={{
                    flex: 'none', width: 100, height: 86, borderRadius: 14,
                    border: `${mc.selected ? 2 : 1.5}px solid ${mc.selected ? '#6d28d9' : '#e6e2ef'}`,
                    background: mc.selected ? '#f3effe' : '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 4, cursor: 'pointer', transition: 'all .14s',
                  }}
                >
                  <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#1c1530' }}>{mc.label}</span>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500, fontSize: 12.5, color: '#9a94a8' }}>{mc.year}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => stripRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
              style={{ position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #e6e2ef', background: '#fff', boxShadow: '0 4px 10px rgba(34,18,68,.12)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              onClick={() => stripRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
              style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #e6e2ef', background: '#fff', boxShadow: '0 4px 10px rgba(34,18,68,.12)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#1c1530', margin: '26px 0 14px' }}>
            How long will you stay?
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1c1530' }}>Months</span>
            <button
              type="button"
              onClick={() => setStayMonths(m => Math.max(1, m - 1))}
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#ece8f6', color: '#4a3d6b', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >−</button>
            <div style={{ width: 60, height: 46, border: '1.5px solid #e6e2ef', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, color: '#1c1530' }}>
              {stayMonths}
            </div>
            <button
              type="button"
              onClick={() => setStayMonths(m => Math.min(24, m + 1))}
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#ece8f6', color: '#4a3d6b', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
            >+</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #efecf5' }}>
        <button
          type="button"
          onClick={handleClear}
          style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#1c1530', background: '#fff', border: '1.5px solid #e6e2ef', padding: '11px 20px', borderRadius: 12, cursor: 'pointer', transition: 'all .14s' }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleApply}
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(180deg, #7c3aed, #6d28d9)', border: 'none', padding: '11px 24px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 10px 22px -6px rgba(109,40,217,.55), inset 0 1px 0 rgba(255,255,255,.22)', transition: 'all .14s' }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function CalendarGrid({ weeks, onDayClick }: { weeks: CalMonth['weeks']; onDayClick: (ds: string) => void }) {
  return (
    <>
      <div style={{ display: 'flex' }}>
        {DOW.map(d => (
          <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9a94a8', textTransform: 'uppercase', paddingBottom: 6 }}>{d}</div>
        ))}
      </div>
      {weeks.map(week => (
        <div key={week.key} style={{ display: 'flex' }}>
          {week.cells.map(cell => {
            if (cell.blank) return <div key={cell.key} style={{ flex: 1, height: 38 }} />;
            const { day, ds, disabled, isStart, isEnd, inRange, isToday } = cell;
            let bg = 'transparent', color = '#1c1530', borderRadius = '10px', fontWeight = 600;
            if (disabled) { color = '#cfc8dd'; }
            else if (isStart || isEnd) { bg = '#6d28d9'; color = '#fff'; borderRadius = '999px'; fontWeight = 700; }
            else if (inRange) { bg = '#f3effe'; color = '#1c1530'; borderRadius = '4px'; }
            else if (isToday) { color = '#6d28d9'; fontWeight = 800; }
            return (
              <button
                key={ds}
                type="button"
                onClick={() => !disabled && onDayClick(ds)}
                disabled={disabled}
                style={{
                  flex: 1, height: 38, margin: 1, border: 'none',
                  fontFamily: 'inherit', fontSize: 13, fontWeight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bg, color, borderRadius,
                  cursor: disabled ? 'default' : 'pointer',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { if (!disabled && !isStart && !isEnd && !inRange) (e.currentTarget as HTMLButtonElement).style.background = '#f6f3fd'; }}
                onMouseLeave={e => { if (!disabled && !isStart && !isEnd && !inRange) (e.currentTarget as HTMLButtonElement).style.background = bg; }}
              >
                {day}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}
