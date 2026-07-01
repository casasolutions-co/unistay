'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Property } from '../../data/properties';

const ListingMap = dynamic(() => import('./ListingMap'), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyListing = Omit<Property, 'badge'> & { badge: 'CASA' | 'PARTNER' | 'PRIVATE'; source?: string; externalLink?: string | null; [key: string]: any };
import styles from './ApartmentDetailsMobile.module.css';

function fmtN(n: number) { return n.toLocaleString('en-US'); }

const PHOTO_BGS = [
  'repeating-linear-gradient(135deg, #2a2336 0 22px, #312942 22px 44px)',
  'repeating-linear-gradient(135deg, #2f2740 0 22px, #372e4a 22px 44px)',
  'repeating-linear-gradient(135deg, #2a2336 0 22px, #332b46 22px 44px)',
];

interface Props { property: AnyListing; }

export default function ApartmentDetailsMobile({ property: p }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const photos = p.photos ?? [];
  const warmRent = p.price;
  const dueTotal = warmRent + (p.deposit ?? 0);
  const isPartner = !!p.externalLink;

  function onGalleryScroll() {
    const el = galleryRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== galleryIndex) setGalleryIndex(idx);
  }

  return (
    <>
      <div className={styles.screen}>
        <div className={styles.scrollArea}>

          {/* ── Gallery ── */}
          <div className={styles.gallery}>
            <div
              className={styles.galleryTrack}
              ref={galleryRef}
              onScroll={onGalleryScroll}
            >
              {photos.length > 0 ? photos.map((ph, i) => (
                <div
                  key={i}
                  className={styles.gallerySlide}
                  style={ph.url
                    ? { backgroundImage: `url(${ph.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: PHOTO_BGS[i % PHOTO_BGS.length] }}
                >
                  {!ph.url && <span className={styles.photoLabel}>[ {ph.label} ]</span>}
                </div>
              )) : (
                <div className={styles.gallerySlide} style={{ background: PHOTO_BGS[0] }}>
                  <span className={styles.photoLabel}>[ photo ]</span>
                </div>
              )}
            </div>

            <div className={styles.galleryGradient} />

            {/* Controls */}
            <div className={styles.galleryControls}>
              <div className={styles.controlsRow}>
                <button type="button" className={styles.iconBtn} onClick={() => router.back()}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
                </button>
                <div className={styles.iconBtnGroup}>
                  <button type="button" className={styles.iconBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => setSaved(s => !s)}
                    style={{ color: saved ? '#6d28d9' : '#1c1530' }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill={saved ? '#6d28d9' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Photo count pill */}
            {photos.length > 0 && (
              <button type="button" className={styles.photoPill} onClick={() => setGalleryOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                {galleryIndex + 1} / {photos.length}
              </button>
            )}
          </div>

          {/* ── Title block ── */}
          <div className={styles.titleBlock}>
            <div className={styles.badgeRow}>
              <span className={styles.badgeCasa} style={{ background: p.badge === 'PARTNER' ? '#1c1530' : p.badge === 'PRIVATE' ? '#0d7a5f' : '#6d28d9' }}>
                {p.badge}
              </span>
              {p.now && (
                <span className={styles.badgeAvail}>
                  <span className={styles.availDot} />
                  Available now
                </span>
              )}
            </div>
            <h1 className={styles.h1}>{p.title}</h1>
            <div className={styles.addressRow}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b0aabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {p.address}
            </div>
          </div>

          {/* ── Stat band ── */}
          <div className={styles.statGrid}>
            {[
              { value: `${p.area} m²`, label: 'Living area', icon: 'M21 3 3 21M9 3H3v6M21 15v6h-6' },
              { value: p.beds, label: 'Bedrooms', icon: 'M2 11h20M2 11V6a2 2 0 0 1 2-2h6v7M22 11v6M2 17h20M4 20v-3M20 20v-3' },
              { value: p.bathrooms ?? '1 bath', label: 'Bathroom', icon: 'M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1ZM6 12V5a2 2 0 0 1 2-2c1 0 1.5.5 2 1' },
              { value: p.floor ?? '3rd flr', label: 'with lift', icon: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M9 3v18M14 9l3-3 3 3M14 15l3 3 3-3' },
            ].map((s, i) => (
              <div key={i} className={styles.statCell}>
                <span className={styles.statIcon}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
                </span>
                <div>
                  <div className={styles.statValue}>{s.value}</div>
                  <div className={styles.statLabel}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── About ── */}
          <div className={styles.sectionFirst}>
            <h2 className={styles.sectionH2}>About this place</h2>
            <p className={styles.bodyText}>{p.description}</p>
          </div>

          {/* ── Amenities ── */}
          {p.amenities?.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionH2}>What this place offers</h2>
              <div className={styles.amenitiesGrid}>
                {p.amenities.map((a, i) => (
                  <div key={i} className={styles.amenityItem}>
                    <span className={styles.amenityIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon}/></svg>
                    </span>
                    <span className={styles.amenityLabel}>{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Location ── */}
          <div className={styles.section}>
            <h2 className={styles.sectionH2}>Where you&apos;ll be</h2>
            <p className={styles.sectionSub}>{p.city} · Germany</p>
            <div className={styles.mapPlaceholder} style={{ overflow: 'hidden' }}>
              <ListingMap
                lat={p.lat ?? 0}
                lng={p.lng ?? 0}
                address={p.address}
                badge={p.badge as 'CASA' | 'PARTNER' | 'PRIVATE'}
              />
            </div>
            {p.nearby?.length > 0 && (
              <div className={styles.nearbyList}>
                {p.nearby.map((n, i) => (
                  <span key={i} className={styles.nearbyItem}>
                    <span className={styles.nearbyIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon}/></svg>
                    </span>
                    {n.label} <span className={styles.nearbyDist}>· {n.dist}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Cost breakdown ── */}
          <div className={styles.section}>
            <h2 className={styles.sectionH2}>What you&apos;ll pay</h2>
            <p className={styles.sectionSub}>Transparent monthly cost and one-time deposit — no hidden fees.</p>

            <div className={styles.costCard}>
              <div className={styles.costRow}>
                <div>
                  <div className={styles.costLabel}>Cold rent</div>
                  <div className={styles.costSub}>Kaltmiete · base rent</div>
                </div>
                <span className={styles.costValue}>€{fmtN(p.coldRent)}</span>
              </div>
              <div className={styles.costRowDashed}>
                <div>
                  <div className={styles.costLabel}>Utilities</div>
                  <div className={styles.costSub}>Nebenkosten · heating, water, internet</div>
                </div>
                <span className={styles.costValue}>+ €{fmtN(p.utilities)}</span>
              </div>
              <div className={styles.costRowTotal}>
                <div>
                  <div className={styles.costTotalLabel}>Warm rent</div>
                  <div className={styles.costTotalSub}>Warmmiete · total per month</div>
                </div>
                <span className={styles.costTotalValue}>€{fmtN(warmRent)}<span className={styles.costTotalPer}> /mo</span></span>
              </div>
            </div>

            <div className={styles.costOneTime}>
              <div className={styles.costRowDashed}>
                <div>
                  <div className={styles.costLabel}>Deposit</div>
                  <div className={styles.costSub}>Kaution · 2 months, refundable</div>
                </div>
                <span className={styles.costValue}>€{fmtN(p.deposit)}</span>
              </div>
              <div className={styles.costDueRow}>
                <span className={styles.costDueLabel}>Due at move-in</span>
                <span className={styles.costDueValue}>€{fmtN(dueTotal)}</span>
              </div>
            </div>
          </div>

          {/* ── Host ── */}
          <div className={styles.hostSection}>
            <div className={styles.hostCard}>
              <div className={styles.hostTop}>
                <div className={styles.hostAvatar}>{p.hostName?.charAt(0)}</div>
                <div>
                  <div className={styles.hostNameRow}>
                    <span className={styles.hostName}>{p.hostName}</span>
                    <span className={styles.hostVerified}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      Verified
                    </span>
                  </div>
                  <div className={styles.hostMeta}>{p.hostListings} listing{p.hostListings === '1' ? '' : 's'}</div>
                </div>
              </div>
              <button type="button" className={styles.messageBtn}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Message host
              </button>
            </div>
          </div>

          <div className={styles.bottomSpacer} />
        </div>
      </div>

      {/* ── Full-screen gallery overlay ── */}
      {galleryOpen && (
        <div className={styles.galleryOverlay}>
          <div className={styles.galleryOverlayHeader}>
            <button type="button" className={styles.galleryOverlayClose} onClick={() => setGalleryOpen(false)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
            <span className={styles.galleryOverlayTitle}>All photos · {photos.length}</span>
            <span style={{ width: 40 }} />
          </div>
          <div className={styles.galleryOverlayScroll}>
            {photos.map((ph, i) => (
              <div key={i} className={styles.galleryOverlayPhoto}
                style={ph.url
                  ? { backgroundImage: `url(${ph.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: PHOTO_BGS[i % PHOTO_BGS.length] }}>
                {!ph.url && <span className={styles.photoLabel}>[ {ph.label} ]</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking bar ── */}
      <div className={styles.bookingBar}>
        <div className={styles.bookingPrice}>
          <div className={styles.bookingPriceRow}>
            <span className={styles.bookingAmount}>€{fmtN(warmRent)}</span>
            <span className={styles.bookingPer}>/mo</span>
          </div>
          <span className={styles.bookingIncl}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            Utilities incl.
          </span>
        </div>
        {isPartner ? (
          <a href={p.externalLink!} target="_blank" rel="noopener noreferrer" className={styles.bookingBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
            View on HousingAnywhere →
          </a>
        ) : (
          <button type="button" className={styles.bookingBtn}>Request to book</button>
        )}
      </div>
    </>
  );
}
