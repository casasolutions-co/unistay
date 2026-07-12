"use client";

import { useState } from "react";
import styles from "./ProposeTimesSheet.module.css";

export interface ProposedSlot {
  date: string;
  time: string;
}

interface ProposeTimesSheetProps {
  open: boolean;
  onClose: () => void;
  onSend: (slots: ProposedSlot[]) => Promise<void> | void;
  listingTitle: string | null;
  listingCity: string | null;
}

const TIME_TEMPLATE = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30"];

function buildDateOptions() {
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key: d.toISOString().slice(0, 10),
      dayLabel: d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase(),
      dayNum: d.getDate(),
      display: d.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    };
  });
}

export default function ProposeTimesSheet({
  open,
  onClose,
  onSend,
  listingTitle,
  listingCity,
}: ProposeTimesSheetProps) {
  // Recomputed on every render (cheap — 4 date calculations) so the sheet
  // always shows today-relative dates even if it's reopened after midnight.
  const dateOptions = buildDateOptions();
  const [selectedDateKey, setSelectedDateKey] = useState(dateOptions[0]?.key);
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  // Reset the sheet's local state whenever it transitions from closed to open
  // (the component stays mounted between opens, so this can't be a lazy
  // useState initializer) — adjusted during render per React's guidance to
  // avoid a setState-in-effect render cascade.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedDateKey(dateOptions[0]?.key);
      setSelectedTimes(new Set());
      setSending(false);
    }
  }

  if (!open) return null;

  const selectedDate = dateOptions.find((d) => d.key === selectedDateKey);

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) => {
      const next = new Set(prev);
      if (next.has(time)) next.delete(time);
      else next.add(time);
      return next;
    });
  };

  const handleSend = async () => {
    if (!selectedDate || selectedTimes.size === 0 || sending) return;
    setSending(true);
    const slots: ProposedSlot[] = TIME_TEMPLATE.filter((t) =>
      selectedTimes.has(t),
    ).map((time) => ({ date: selectedDate.display, time }));
    await onSend(slots);
    setSending(false);
  };

  const content = (
    <>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Propose viewing times</div>
          {listingTitle && (
            <div className={styles.subtitle}>
              {listingTitle}
              {listingCity ? ` · ${listingCity}` : ""}
            </div>
          )}
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.sectionLabel}>Select a date</div>
        <div className={styles.dateRow}>
          {dateOptions.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`${styles.dateChip}${d.key === selectedDateKey ? ` ${styles.dateChipActive}` : ""}`}
              onClick={() => setSelectedDateKey(d.key)}
            >
              <div className={styles.dateChipDay}>{d.dayLabel}</div>
              <div className={styles.dateChipNum}>{d.dayNum}</div>
            </button>
          ))}
        </div>

        <div className={styles.sectionLabel}>
          Available times{selectedDate ? ` · ${selectedDate.display}` : ""}
        </div>
        <div className={styles.timeGrid}>
          {TIME_TEMPLATE.map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.timeSlot}${selectedTimes.has(t) ? ` ${styles.timeSlotActive}` : ""}`}
              onClick={() => toggleTime(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={selectedTimes.size === 0 || sending}
        >
          {sending
            ? "Sending…"
            : `Send times · ${selectedTimes.size} selected`}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop centered modal */}
      <div className={styles.desktopOverlay} onClick={onClose}>
        <div className={styles.desktopModal} onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className={styles.mobileScrim} onClick={onClose}>
        <div className={styles.mobileSheet} onClick={(e) => e.stopPropagation()}>
          <div className={styles.sheetHandle} />
          {content}
        </div>
      </div>
    </>
  );
}
