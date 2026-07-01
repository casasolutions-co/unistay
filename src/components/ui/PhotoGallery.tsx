'use client'

import { useState } from 'react'

function photoUrl(key: string): string {
  return `/api/admin-photo?key=${encodeURIComponent(key)}`
}

export default function PhotoGallery({ photoKeys }: { photoKeys: string[] }) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  if (photoKeys.length === 0) {
    return (
      <div style={{ height: 90, borderRadius: 14, border: '1.5px dashed #ddd0f6', background: '#faf9fc', display: 'grid', placeItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#b0aabf' }}>No photos uploaded yet</span>
      </div>
    )
  }

  const prev = (e?: React.MouseEvent) => { e?.stopPropagation(); setIndex(i => (i - 1 + photoKeys.length) % photoKeys.length) }
  const next = (e?: React.MouseEvent) => { e?.stopPropagation(); setIndex(i => (i + 1) % photoKeys.length) }

  return (
    <>
      <div
        onClick={() => setLightbox(true)}
        style={{ position: 'relative', height: 210, borderRadius: 14, overflow: 'hidden', cursor: 'zoom-in', background: '#eee' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(photoKeys[index])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        {photoKeys.length > 1 && (
          <>
            <button type="button" onClick={prev} style={navBtnStyle('left')}>‹</button>
            <button type="button" onClick={next} style={navBtnStyle('right')}>›</button>
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
              {photoKeys.map((key, i) => (
                <span
                  key={key}
                  onClick={e => { e.stopPropagation(); setIndex(i) }}
                  style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 999, background: i === index ? '#fff' : 'rgba(255,255,255,.55)', transition: 'width .15s' }}
                />
              ))}
            </div>
            <span style={{ position: 'absolute', top: 10, right: 12, fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, color: '#fff', background: 'rgba(0,0,0,.4)', padding: '3px 8px', borderRadius: 999 }}>
              {index + 1} / {photoKeys.length}
            </span>
          </>
        )}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(14,9,24,.92)', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 26px' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.62)' }}>
              {index + 1} / {photoKeys.length}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.22)', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700 }}
            >
              Close
            </button>
          </div>
          <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 20px', minHeight: 0 }}>
            {photoKeys.length > 1 && (
              <button type="button" onClick={prev} style={{ flex: 'none', width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,.22)', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer' }}>‹</button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(photoKeys[index])} alt="" style={{ maxWidth: 'min(1040px, 78vw)', maxHeight: '72vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 30px 80px -20px rgba(0,0,0,.7)' }} />
            {photoKeys.length > 1 && (
              <button type="button" onClick={next} style={{ flex: 'none', width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,.22)', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer' }}>›</button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function navBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: 8,
    transform: 'translateY(-50%)',
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,.4)',
    color: '#fff',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    fontSize: 16,
  }
}
