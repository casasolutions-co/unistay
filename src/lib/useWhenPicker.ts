'use client';

import { useState } from 'react';

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const FLEX_OPTS = [
  { key: 'exact', label: 'Exact dates' },
  { key: '1week', label: '± 1 week' },
  { key: '2weeks', label: '± 2 weeks' },
] as const;

export const FLEXWIN_OPTS = [
  { key: '3m', label: 'Within 3 months' },
  { key: '6m', label: 'Within 6 months' },
  { key: 'anytime', label: "I'm not sure yet" },
] as const;

export type WhenMode = 'date' | 'month' | 'flexible';

function pad(n: number) { return n < 10 ? '0' + n : '' + n; }

export function todayStr() {
  const t = new Date();
  return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
}

export function currentMonthKey() {
  const t = new Date();
  return t.getFullYear() + '-' + pad(t.getMonth() + 1);
}

export function fmtNice(ds: string) {
  if (!ds) return '';
  const p = ds.split('-');
  return parseInt(p[2], 10) + ' ' + ABBR[parseInt(p[1], 10) - 1] + ' ' + p[0];
}

export function monthOptionsList() {
  const t = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < 15; i++) {
    let m = t.getMonth() + i;
    const y = t.getFullYear() + Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    opts.push({ value: y + '-' + pad(m + 1), label: MONTH_NAMES[m] + ' ' + y });
  }
  return opts;
}

/**
 * Shared state + derived values for the mobile "When" date picker
 * (used by both the hero search card and the search-results filter sheet).
 */
export function useWhenPicker(initialMoveIn = '', initialMoveOut = '') {
  const [mode, setMode] = useState<WhenMode>('date');
  const [moveIn, setMoveInRaw] = useState(initialMoveIn);
  const [moveOut, setMoveOut] = useState(initialMoveOut);
  const [noEndDate, setNoEndDate] = useState(false);
  const [flex, setFlex] = useState<'exact' | '1week' | '2weeks'>('exact');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [stayMonths, setStayMonths] = useState(3);
  const [flexWindow, setFlexWindow] = useState<string | null>(null);

  function setMoveIn(v: string) {
    setMoveInRaw(v);
    setMoveOut(mo => (mo && mo < v) ? '' : mo);
  }

  function toggleNoEnd() {
    setNoEndDate(p => {
      const next = !p;
      if (next) setMoveOut('');
      return next;
    });
  }

  const monthOptions = monthOptionsList();
  const selMonth = monthOptions.find(m => m.value === selectedMonth);
  const hasMoveIn = !!moveIn;
  const hasMoveOut = !!moveOut && !noEndDate;

  const dateValueText = !hasMoveIn ? 'Add dates'
    : noEndDate ? 'From ' + fmtNice(moveIn) + ' · No end date'
    : hasMoveOut ? fmtNice(moveIn) + ' – ' + fmtNice(moveOut)
    : fmtNice(moveIn) + ' · Add move-out';
  const monthValueText = selMonth ? selMonth.label + ' · ' + stayMonths + (stayMonths === 1 ? ' month' : ' months') : 'Choose a month';
  const flexValueText = flexWindow ? (FLEXWIN_OPTS.find(f => f.key === flexWindow)?.label ?? "I'm flexible") : "I'm flexible";

  const triggerText = mode === 'date' ? dateValueText : mode === 'month' ? monthValueText : flexValueText;
  const triggerMuted = mode === 'date' ? !hasMoveIn : mode === 'month' ? !selMonth : !flexWindow;

  // Resolved move-in/move-out actually usable for filtering/search, regardless of active tab.
  let resolvedMoveIn = '';
  let resolvedMoveOut = '';
  if (mode === 'date') {
    resolvedMoveIn = moveIn;
    resolvedMoveOut = noEndDate ? '' : moveOut;
  } else if (mode === 'month' && selMonth) {
    const [y, m] = selectedMonth.split('-').map(Number);
    resolvedMoveIn = selectedMonth + '-01';
    let outY = y, outM = m - 1 + stayMonths;
    outY += Math.floor(outM / 12);
    outM = outM % 12;
    resolvedMoveOut = outY + '-' + pad(outM + 1) + '-01';
  }

  function clear() {
    setMoveInRaw(''); setMoveOut(''); setNoEndDate(false);
    setFlex('exact'); setSelectedMonth(currentMonthKey());
    setStayMonths(3); setFlexWindow(null); setMode('date');
  }

  return {
    mode, setMode,
    moveIn, setMoveIn,
    moveOut, setMoveOut,
    noEndDate, toggleNoEnd,
    flex, setFlex,
    selectedMonth, setSelectedMonth,
    stayMonths, setStayMonths,
    flexWindow, setFlexWindow,
    monthOptions,
    triggerText, triggerMuted,
    resolvedMoveIn, resolvedMoveOut,
    clear,
  };
}

export type WhenPicker = ReturnType<typeof useWhenPicker>;
