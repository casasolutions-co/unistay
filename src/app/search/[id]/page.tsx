'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { PROPERTIES, Property, PropertyPhoto } from '../../data/properties';
import styles from './page.module.css';
import ApartmentDetailsMobile from './ApartmentDetailsMobile';

function initials(user: User | null) {
  if (!user) return '??';
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

/* ── SVGs ───────────────────────────────────────────────────────── */
const IBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

const IShare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
  </svg>
);

const ISave = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
  </svg>
);

const IStar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#f5a623" stroke="#f5a623" strokeWidth="1.5" strokeLinejoin="round">
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ICheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IMessage = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IBrandLogo = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11.2 12 4l9 7.2" />
    <path d="M5.5 9.8V20h13V9.8" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

const ISearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3-3" />
  </svg>
);

const IPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IBell = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const IClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  // Find property
  const property = PROPERTIES.find(p => p.id === id) || PROPERTIES[0];

  const [authUser, setAuthUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setAuthUser), []);

  // States
  const [saved, setSaved] = useState(false);
  const [moveIn, setMoveIn] = useState('2026-07-01');
  const [moveOut, setMoveOut] = useState('2027-06-30');
  
  // Lightbox
  const [lightbox, setLightbox] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  // Message Host Modal
  const [msgModal, setMsgModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [msgSent, setMsgSent] = useState(false);
  
  // Notification states
  const [booked, setBooked] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keyboard handlers for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') setPhotoIdx(i => (i + 1) % property.photos.length);
      if (e.key === 'ArrowLeft') setPhotoIdx(i => (i - 1 + property.photos.length) % property.photos.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox, property.photos.length]);

  // Live calculations
  const fmtN = (n: number) => n.toLocaleString('en-US');
  const coldRent = property.coldRent;
  const utilities = property.utilities;
  const warmRent = coldRent + utilities;
  const deposit = coldRent * 2;
  const serviceFee = property.serviceFee;
  const totalDue = warmRent + deposit + serviceFee;

  // Actions
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBook = () => {
    setBooked(true);
    setTimeout(() => setBooked(false), 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMsgSent(true);
    setTimeout(() => {
      setMsgModal(false);
      setMessageText('');
      setMsgSent(false);
    }, 2000);
  };

  return (
    <div style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif', color: '#1c1530', background: 'var(--page)', minHeight: '100vh' }}>

      {/* ── MOBILE VIEW ── */}
      <div className={styles.mobileOnly}>
        <ApartmentDetailsMobile property={property} />
      </div>

      {/* ── DESKTOP VIEW ── */}
      <div className={styles.desktopOnly}>
      
      {/* ── TOAST NOTIFICATIONS ── */}
      {copied && (
        <div className={styles.toast}>
          Link copied to clipboard!
        </div>
      )}
      {booked && (
        <div className={styles.toast} style={{ background: '#1f8a5b' }}>
          Booking request sent successfully!
        </div>
      )}

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <Link href="/search" className={styles.brand}>
          <div className={styles.brandIcon}><IBrandLogo /></div>
          <span className={styles.wordmark}>UniStay</span>
        </Link>

        <div className={styles.navSearchWrap}>
          <span className={styles.navSearchIcon}><ISearch /></span>
          <input
            type="text"
            className={styles.navSearchInput}
            placeholder="Search city or university…"
            defaultValue={property.city}
            onClick={() => router.push('/search')}
            readOnly
          />
        </div>

        <div className={styles.navRight}>
          <Link href="/search" className={styles.navExplore}>Explore</Link>
          <button type="button" className={styles.navListBtn}>
            <IPlus /> List your place
          </button>
          <button type="button" className={styles.bellBtn}>
            <IBell /><span className={styles.bellDot} />
          </button>
          <span className={styles.avatar}>{initials(authUser)}</span>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div className={styles.mainContainer}>

        {/* BREADCRUMB + ACTIONS */}
        <div className={styles.breadcrumbRow}>
          <Link href="/search" className={styles.backLink}>
            <IBack /> Back to results
          </Link>
          <div className={styles.actionBtns}>
            <button type="button" className={styles.actionBtn} onClick={handleShare}>
              <IShare /> Share
            </button>
            <button
              type="button"
              className={saved ? styles.savedBtn : styles.actionBtn}
              onClick={() => setSaved(!saved)}
            >
              <ISave filled={saved} /> {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* GALLERY */}
        <div className={styles.galleryGrid}>
          {/* Main big image */}
          <div
            onClick={() => { setPhotoIdx(0); setLightbox(true); }}
            className={styles.galleryMain}
            style={{ background: `repeating-linear-gradient(135deg, ${property.photos[0].a} 0 18px, ${property.photos[0].b} 18px 36px)` }}
          >
            <span className={styles.badge} style={{ background: property.badge === 'PARTNER' ? '#1c1530' : 'var(--brand)' }}>
              {property.badge}
            </span>
            <span className={styles.photoLabel}>{property.photos[0].label}</span>
          </div>

          {/* Right 2x2 grid */}
          <div className={styles.galleryThumbs}>
            {property.photos.slice(1, 5).map((photo, i) => (
              <div
                key={photo.label}
                onClick={() => { setPhotoIdx(i + 1); setLightbox(true); }}
                className={styles.galleryThumb}
                style={{ background: `repeating-linear-gradient(135deg, ${photo.a} 0 14px, ${photo.b} 14px 28px)` }}
              >
                <span className={styles.thumbLabel}>{photo.label}</span>
                {i === 3 && (
                  <button
                    type="button"
                    className={styles.showAllBtn}
                    onClick={(e) => { e.stopPropagation(); setPhotoIdx(0); setLightbox(true); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Show all {property.photos.length}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SPLIT LAYOUT */}
        <div className={styles.splitLayout}>

          {/* LEFT: Details */}
          <div className={styles.leftCol}>
            
            {/* Title section */}
            <div className={styles.titleSection}>
              <div className={styles.badgeRow}>
                <span className={styles.typeBadge}>{property.type}</span>
                <span className={styles.availBadge}>
                  <span className={styles.availDot} />
                  {property.avail}
                </span>
              </div>
              <h1 className={styles.titleText}>{property.title}</h1>
              <div className={styles.ratingRow}>
                <span className={styles.addressText}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#b0aabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {property.address}
                </span>
                <span className={styles.stars}>
                  <IStar /> {property.rating} <span className={styles.reviewsCount}>· {property.reviewsCount} reviews</span>
                </span>
              </div>
            </div>

            {/* Key stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 3 3 21M9 3H3v6M21 15v6h-6" />
                  </svg>
                </span>
                <div className={styles.statVal}>{property.area} m²</div>
                <div className={styles.statLbl}>Living area</div>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 11h20M2 11V6a2 2 0 0 1 2-2h6v7M22 11v6M2 17h20M4 20v-3M20 20v-3" />
                  </svg>
                </span>
                <div className={styles.statVal}>{property.beds}</div>
                <div className={styles.statLbl}>Bedrooms</div>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1ZM6 12V5a2 2 0 0 1 2-2c1 0 1.5.5 2 1" />
                  </svg>
                </span>
                <div className={styles.statVal}>{property.bathrooms || '1 bath'}</div>
                <div className={styles.statLbl}>Bathroom</div>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M9 3v18M14 9l3-3 3 3M14 15l3 3 3-3" />
                  </svg>
                </span>
                <div className={styles.statVal}>{property.floor || '1st floor'}</div>
                <div className={styles.statLbl}>Floor</div>
              </div>
            </div>

            {/* Description & What you pay grid */}
            <div className={styles.aboutGrid}>
              <div className={styles.descriptionSection}>
                <h2 className={styles.sectionHeader}>About this place</h2>
                <p className={styles.descriptionText}>{property.description}</p>
                <p className={styles.descriptionText}>
                  Rent is all-inclusive: heating, water, electricity, and high-speed internet are covered. Ideal for students or young professionals on a 6–12 month contract.
                </p>
              </div>

              {/* What you pay cost breakdown */}
              <div className={styles.costsCard}>
                <div className={styles.costsCardHeader}>
                  <h3 className={styles.costsCardTitle}>What you pay</h3>
                  <p className={styles.costsCardSubtitle}>Transparent — no hidden fees</p>
                </div>
                <div className={styles.costsList}>
                  <div className={styles.costItem}>
                    <span>Cold rent <span className={styles.langMuted}>· Kaltmiete</span></span>
                    <span className={styles.bricolageVal}>€{fmtN(coldRent)}</span>
                  </div>
                  <div className={styles.costItem} style={{ borderTop: '1px dashed var(--divider)' }}>
                    <span>Utilities <span className={styles.langMuted}>· Nebenkosten</span></span>
                    <span className={styles.bricolageVal}>+ €{fmtN(utilities)}</span>
                  </div>
                </div>
                <div className={styles.warmRentBanner}>
                  <div>
                    <div className={styles.warmRentLabel}>Warm rent</div>
                    <div className={styles.warmRentMuted}>Warmmiete · per month</div>
                  </div>
                  <span className={styles.warmRentPrice}>€{fmtN(warmRent)}</span>
                </div>
                <div className={styles.costsList} style={{ borderTop: '1px solid var(--divider)', paddingTop: '6px' }}>
                  <div className={styles.costItem}>
                    <span>Deposit <span className={styles.langMuted}>· Refundable</span></span>
                    <span className={styles.bricolageVal}>€{fmtN(deposit)}</span>
                  </div>
                  <div className={styles.costItem} style={{ borderTop: '1px dashed var(--divider)' }}>
                    <span>UniStay service fee <span className={styles.langMuted}>· One-time</span></span>
                    <span className={styles.bricolageVal}>€{fmtN(serviceFee)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className={styles.amenitiesSection}>
              <h2 className={styles.sectionHeader}>What this place offers</h2>
              <div className={styles.amenitiesGrid}>
                {property.amenities.map(amenity => (
                  <div key={amenity.label} className={styles.amenityRow}>
                    <span className={styles.amenityIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={amenity.icon} />
                      </svg>
                    </span>
                    <span className={styles.amenityLabel}>{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map & nearby transit */}
            <div className={styles.locationSection}>
              <h2 className={styles.sectionHeader}>Where you&apos;ll be</h2>
              <p className={styles.locationSubText}>{property.city} · Germany</p>
              
              <div className={styles.mockMap}>
                <div className={styles.mockMapGrid} />
                <div className={styles.mockMapWater1} />
                <div className={styles.mockMapWater2} />
                <span className={styles.mockMapLabel}>[ interactive map — {property.city} ]</span>
                <div className={styles.mapPin}>
                  <div className={styles.mapPinInner}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 11.2 12 4l9 7.2" />
                      <path d="M5.5 9.8V20h13V9.8" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={styles.nearbyGrid}>
                {property.nearby.map(place => (
                  <span key={place.label} className={styles.nearbyItem}>
                    <span className={styles.nearbyIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={place.icon} />
                      </svg>
                    </span>
                    <span className={styles.nearbyLabel}>{place.label}</span>
                    <span className={styles.nearbyDist}>· {place.dist}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Host Section */}
            <div className={styles.hostSection}>
              <span className={styles.hostAvatar}>
                {property.hostName.charAt(0)}
              </span>
              <div>
                <div className={styles.hostHeaderRow}>
                  <span className={styles.hostName}>{property.hostName}</span>
                  <span className={styles.verifiedBadge}>
                    <ICheck /> Verified
                  </span>
                </div>
                <div className={styles.hostSubText}>
                  {property.hostReplies} · {property.hostListings}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Booking rail */}
          <div className={styles.rightCol}>
            <div className={styles.bookingCard}>
              <div className={styles.bookingPriceHeader}>
                <span className={styles.bookingPrice}>€{fmtN(warmRent)}</span>
                <span className={styles.bookingPriceUnit}>/ month</span>
              </div>
              <div className={styles.bookingInclText}>
                <ICheck /> Utilities included
              </div>

              {/* Date pickers */}
              <div className={styles.datePickerContainer}>
                <div className={styles.datePickerInput} style={{ borderRight: '1.5px solid var(--border)' }}>
                  <label className={styles.datePickerLabel}>Move-in</label>
                  <input
                    type="date"
                    className={styles.nativeDatePicker}
                    value={moveIn}
                    onChange={e => setMoveIn(e.target.value)}
                  />
                </div>
                <div className={styles.datePickerInput}>
                  <label className={styles.datePickerLabel}>Move-out</label>
                  <input
                    type="date"
                    className={styles.nativeDatePicker}
                    value={moveOut}
                    onChange={e => setMoveOut(e.target.value)}
                  />
                </div>
              </div>

              <button type="button" className={styles.bookBtn} onClick={handleBook}>
                Request to book
              </button>
              
              <button type="button" className={styles.msgBtn} onClick={() => setMsgModal(true)}>
                <IMessage /> Message host
              </button>

              <p className={styles.noChargeText}>You won&apos;t be charged yet</p>

              {/* Cost breakdown items */}
              <div className={styles.breakdownContainer}>
                <div className={styles.breakdownRow}>
                  <span>First month rent</span>
                  <span className={styles.breakdownVal}>€{fmtN(warmRent)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Deposit (refundable)</span>
                  <span className={styles.breakdownVal}>€{fmtN(deposit)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>UniStay service fee</span>
                  <span className={styles.breakdownVal}>€{fmtN(serviceFee)}</span>
                </div>
                
                <div className={styles.breakdownTotalRow}>
                  <span>Due at move-in</span>
                  <span>€{fmtN(totalDue)}</span>
                </div>
              </div>
            </div>

            {/* Verified badge note */}
            <div className={styles.verifiedAlert}>
              <span className={styles.alertIcon}><IShield /></span>
              <span className={styles.alertText}>
                Every {property.badge.toLowerCase()} listing is ID-verified. Never pay or transfer outside UniStay.
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ── LIGHTBOX MODAL ── */}
      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(false)}>
          
          {/* Top navigation */}
          <div className={styles.lightboxTopBar} onClick={e => e.stopPropagation()}>
            <span className={styles.lightboxCounter}>
              {photoIdx + 1} / {property.photos.length}
            </span>
            <button type="button" className={styles.lightboxClose} onClick={() => setLightbox(false)}>
              <IClose /> Close
            </button>
          </div>

          {/* Photo stage */}
          <div className={styles.lightboxStage}>
            <button
              type="button"
              className={styles.navArrow}
              onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + property.photos.length) % property.photos.length); }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div
              className={styles.lightboxActiveImg}
              onClick={e => e.stopPropagation()}
              style={{ background: `repeating-linear-gradient(135deg, ${property.photos[photoIdx].a} 0 26px, ${property.photos[photoIdx].b} 26px 52px)` }}
            >
              <span className={styles.lightboxPhotoLabel}>{property.photos[photoIdx].label}</span>
            </div>

            <button
              type="button"
              className={styles.navArrow}
              onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % property.photos.length); }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className={styles.lightboxStrip} onClick={e => e.stopPropagation()}>
            {property.photos.map((p, idx) => (
              <div
                key={p.label}
                onClick={() => setPhotoIdx(idx)}
                className={`${styles.lightboxStripThumb} ${idx === photoIdx ? styles.lightboxStripThumbActive : ''}`}
                style={{
                  background: `repeating-linear-gradient(135deg, ${p.a} 0 12px, ${p.b} 12px 24px)`,
                  opacity: idx === photoIdx ? 1 : 0.4
                }}
              />
            ))}
          </div>

        </div>
      )}

      {/* ── MESSAGE HOST MODAL ── */}
      {msgModal && (
        <div className={styles.modalOverlay} onClick={() => setMsgModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Message Host</h3>
              <button type="button" className={styles.modalClose} onClick={() => setMsgModal(false)}>
                <IClose />
              </button>
            </div>
            
            {msgSent ? (
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>
                  <ICheck />
                </div>
                <h4 className={styles.successTitle}>Message Sent!</h4>
                <p className={styles.successSub}>Your message has been delivered to {property.hostName}.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage}>
                <div className={styles.hostSummaryRow}>
                  <span className={styles.miniHostAvatar}>{property.hostName.charAt(0)}</span>
                  <div>
                    <div className={styles.miniHostName}>{property.hostName}</div>
                    <div className={styles.miniHostSub}>{property.hostReplies}</div>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.modalInputLabel}>Your Message</label>
                  <textarea
                    required
                    className={styles.modalTextarea}
                    rows={4}
                    placeholder={`Hi ${property.hostName}, I am very interested in this place...`}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                  />
                </div>
                
                <button type="submit" className={styles.modalSubmitBtn}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      </div>{/* end desktopOnly */}

    </div>
  );
}
