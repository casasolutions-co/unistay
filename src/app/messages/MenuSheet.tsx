"use client";

import { useEffect, useRef, ReactNode } from "react";
import styles from "./MenuSheet.module.css";

export interface MenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
  /** Colored icon box (attachment-menu style) instead of a plain inline icon. */
  iconBg?: string;
  iconColor?: string;
}

interface MenuSheetProps {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  /** Desktop popover layout. Defaults to a list of icon+label rows. */
  layout?: "list" | "grid";
  /** Mobile sheet layout override — e.g. the attachment sheet is a 3-col icon
   * grid on mobile even though its desktop popover is a list. Defaults to `layout`. */
  mobileLayout?: "list" | "grid";
  title?: string;
  /** Where the desktop popover opens relative to its trigger. */
  align?: "below-right" | "above-left";
}

export default function MenuSheet({
  open,
  onClose,
  items,
  layout = "list",
  mobileLayout,
  title,
  align = "below-right",
}: MenuSheetProps) {
  const effectiveMobileLayout = mobileLayout ?? layout;
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
  };

  const renderItems = (gridLayout: boolean) =>
    items.map((item) => {
      const boxedIconStyle = item.iconBg
        ? { background: item.iconBg, color: item.iconColor }
        : undefined;
      return (
        <div key={item.key} style={{ display: "contents" }}>
          {item.divider && <div className={styles.divider} />}
          {gridLayout ? (
            <button
              type="button"
              className={styles.gridItem}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
            >
              <span className={styles.gridIcon} style={boxedIconStyle}>
                {item.icon}
              </span>
              <span className={styles.gridLabel}>{item.label}</span>
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.listItem}${item.destructive ? ` ${styles.destructive}` : ""}`}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
            >
              <span
                className={`${styles.listIcon}${item.iconBg ? ` ${styles.listIconBoxed}` : ""}`}
                style={boxedIconStyle}
              >
                {item.icon}
              </span>
              <span className={styles.listLabel}>{item.label}</span>
            </button>
          )}
        </div>
      );
    });

  return (
    <>
      {/* Desktop popover */}
      <div
        ref={popoverRef}
        className={[
          styles.popover,
          layout === "grid" ? styles.popoverGrid : "",
          align === "above-left" ? styles.popoverAboveLeft : styles.popoverBelowRight,
        ].join(" ")}
      >
        {title && <div className={styles.popoverTitle}>{title}</div>}
        <div className={layout === "grid" ? styles.gridWrap : styles.listWrap}>
          {renderItems(layout === "grid")}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className={styles.mobileScrim} onClick={onClose}>
        <div
          className={styles.mobileSheet}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.sheetHandle} />
          {title && <div className={styles.sheetTitle}>{title}</div>}
          <div
            className={
              effectiveMobileLayout === "grid" ? styles.gridWrap : styles.listWrap
            }
          >
            {renderItems(effectiveMobileLayout === "grid")}
          </div>
        </div>
      </div>
    </>
  );
}
