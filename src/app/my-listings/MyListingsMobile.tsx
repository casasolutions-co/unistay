'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MobileTabBar from '../components/MobileTabBar';
import { useMyListings } from './useMyListings';
import styles from './MyListingsMobile.module.css';

type Tab = 'published' | 'drafts';

function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const IPhoto = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 17-5-5L5 19" />
  </svg>
);

const IChevronLeft = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const IPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function MyListingsMobile() {
  const router = useRouter();
  const { user, authReady, loading, drafts, published, deleteDraft, setStatus } = useMyListings();
  const [tab, setTab] = useState<Tab>('published');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState<string | null>(null);

  if (!authReady) return null;

  if (!user) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Link href="/settings" className={styles.backBtn}><IChevronLeft /></Link>
            <h1 className={styles.headerTitle}>My listings</h1>
          </div>
        </div>
        <div className={styles.signedOutBody}>
          <span className={styles.signedOutIcon}><IPhoto /></span>
          <h2 className={styles.signedOutTitle}>Sign in to see your listings</h2>
          <p className={styles.signedOutSub}>Log in to manage your published listings and drafts.</p>
          <Link href="/login" className={styles.signInBtn}>Log in</Link>
        </div>
        <MobileTabBar active="profile" />
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Link href="/settings" className={styles.backBtn}><IChevronLeft /></Link>
          <h1 className={styles.headerTitle}>My listings</h1>
        </div>
        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${tab === 'published' ? styles.tabActive : ''}`} onClick={() => setTab('published')}>
            Published
          </button>
          <button type="button" className={`${styles.tab} ${tab === 'drafts' ? styles.tabActive : ''}`} onClick={() => setTab('drafts')}>
            Drafts
            {drafts.length > 0 && <span className={styles.tabCount}>{drafts.length}</span>}
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          [0, 1].map(i => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonImg} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineSm} />
              </div>
            </div>
          ))
        ) : tab === 'drafts' ? (
          <>
            {drafts.map(d => (
              <div key={d.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.thumb}>
                    <div className={styles.thumbIcon}><IPhoto /></div>
                    <span className={styles.pillDraft}>Draft</span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={d.title === 'Untitled listing' ? styles.cardTitleMuted : styles.cardTitle}>{d.title}</div>
                    <div className={styles.cardLocation}>{d.location}</div>
                    <div className={styles.progressWrap}>
                      <div className={styles.progressRow}>
                        <span className={styles.progressLabel}>Step {d.step} of {d.of}</span>
                        <span className={styles.progressPct}>{d.pct}%</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${d.pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.savedText}>{d.savedText}</span>
                  <div className={styles.actions}>
                    <button type="button" className={styles.iconBtnDanger} onClick={() => setConfirmDelete(d.id)} aria-label="Delete draft">
                      <Icon d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                    </button>
                    <button type="button" className={styles.primaryBtn} onClick={() => router.push(`/list?draft=${d.id}`)}>Resume</button>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/list" className={styles.newListingCta}>
              <IPlus />
              <span>Start a new listing</span>
            </Link>
          </>
        ) : published.length > 0 ? (
          published.map(p => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.thumb}>
                  {p.coverPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverPhoto} alt="" className={styles.thumbImg} />
                  ) : (
                    <div className={styles.thumbIcon}><IPhoto /></div>
                  )}
                  {p.status === 'pending_review' ? (
                    <span className={styles.pillReview}>Under review</span>
                  ) : (
                    <button
                      type="button"
                      className={p.status === 'rented' ? styles.pillRented : styles.pillActive}
                      onClick={() => setStatus(p.id, p.status === 'rented' ? 'published' : 'rented')}
                    >
                      {p.status === 'rented' ? 'Rented' : 'Active'}
                      <Icon d="M21 2v6h-6M3 22v-6h6M3 8a9 9 0 0 1 15-4l3 3M21 16a9 9 0 0 1-15 4l-3-3" size={9} />
                    </button>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTopRow}>
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.cardTitle}>{p.title}</div>
                      <div className={styles.cardLocation}>{p.location}</div>
                    </div>
                    <button
                      type="button"
                      className={styles.menuBtn}
                      onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                      aria-label="Listing actions"
                    >
                      <Icon d="M12 5v.01M12 12v.01M12 19v.01" />
                    </button>
                  </div>
                  <div className={styles.spacer} />
                  <div className={styles.rentLine}>
                    {p.rent}<span className={styles.rentSuffix}> /month</span>
                  </div>
                </div>
              </div>

              {menuOpenId === p.id && (
                <div className={styles.menuSection}>
                  {p.status !== 'pending_review' && (
                    <button
                      type="button"
                      className={styles.menuItem}
                      onClick={() => { setMenuOpenId(null); setStatus(p.id, p.status === 'rented' ? 'published' : 'rented'); }}
                    >
                      {p.status === 'rented' ? 'Mark as available' : 'Mark as rented'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.menuItemDanger}
                    onClick={() => { setMenuOpenId(null); setConfirmUnpublish(p.id); }}
                  >
                    Unpublish
                  </button>
                </div>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.savedText}>{p.publishedText} · {p.applications} {p.applications === 1 ? 'application' : 'applications'}</span>
                <div className={styles.actions}>
                  <Link href={`/search/${p.id}`} className={styles.secondaryBtn}>Preview</Link>
                  <button type="button" className={styles.primaryBtn} onClick={() => router.push(`/list?draft=${p.id}`)}>Edit</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <Link href="/list" className={styles.newListingCta}>
            <IPlus />
            <span>Start a new listing</span>
          </Link>
        )}
      </div>

      <MobileTabBar active="profile" />

      {menuOpenId && <div className={styles.clickAway} onClick={() => setMenuOpenId(null)} />}

      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Delete this draft?</div>
            <div className={styles.modalSub}>This can&apos;t be undone.</div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button type="button" className={styles.dangerBtnSolid} onClick={() => { const id = confirmDelete; setConfirmDelete(null); deleteDraft(id); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {confirmUnpublish && (
        <div className={styles.modalOverlay} onClick={() => setConfirmUnpublish(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>Unpublish this listing?</div>
            <div className={styles.modalSub}>It will be hidden from search and moved to Drafts until you republish it.</div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setConfirmUnpublish(null)}>Cancel</button>
              <button
                type="button"
                className={styles.dangerBtnSolid}
                onClick={() => { const id = confirmUnpublish; setConfirmUnpublish(null); setStatus(id, 'draft'); }}
              >
                Unpublish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
