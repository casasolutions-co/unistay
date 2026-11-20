import type { LandlordAnswers as Answers } from '@/lib/types'

const RENTAL_LABEL: Record<string, string> = { owner: 'Private owner', sublet: 'Subletting (main tenant)', agency: 'Agency / property manager' }
const COUNT_LABEL: Record<string, string> = { '1': '1 place', '2-5': '2–5 places', '6+': '6+ places' }
// Mirrors DECLARATIONS in the student app's src/lib/landlordApplication.ts.
const DECLARATIONS: Record<string, string> = {
  right_to_rent: 'Has the right to rent these places',
  accurate_listings: 'Listings will be accurate',
  no_payment_before_contract: 'No money before a contract',
  fair_treatment: 'Treats applicants fairly (AGG)',
}
const DECLARATION_COUNT = Object.keys(DECLARATIONS).length

// Worth a closer look: subletting needs written permission (§ 540 BGB), and a
// private owner with 6+ places is usually an agency.
function flag(a: Answers): string | null {
  if (a.rentalType === 'sublet') return 'Ask for sublet permission'
  if (a.rentalType === 'owner' && a.listingCount === '6+') return 'Owner with 6+ places'
  return null
}

function Flag({ a }: { a: Answers }) {
  const f = flag(a)
  return f ? <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: '#b45309', background: '#fff7ed', padding: '2px 9px', borderRadius: 999 }}>{f}</span> : null
}

const website = (a: Answers) => a.companyWebsite && (
  <a href={a.companyWebsite} target="_blank" rel="noopener noreferrer" style={{ color: '#6d28d9' }}>{a.companyWebsite.replace(/^https?:\/\//, '')}</a>
)
const phone = (a: Answers) => <a href={`tel:${a.phone.replace(/[^+\d]/g, '')}`} style={{ color: 'inherit' }}>{a.phone}</a>

// Compact version for the Landlord requests table.
export function LandlordAnswersCompact({ a, applicationCount }: { a: Answers; applicationCount: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12.5, fontWeight: 600, color: '#4a4654' }}>
      <div style={{ fontWeight: 700, color: '#1c1530' }}>{RENTAL_LABEL[a.rentalType] ?? a.rentalType} · {COUNT_LABEL[a.listingCount] ?? a.listingCount}</div>
      {a.companyName && <div>{a.companyName}{a.companyWebsite && <> · {website(a)}</>}</div>}
      <div>{phone(a)}</div>
      <div style={{ color: '#9a94a8' }}>
        {a.declarations.length >= DECLARATION_COUNT ? `All ${DECLARATION_COUNT} declarations confirmed` : `${a.declarations.length}/${DECLARATION_COUNT} declarations`} · Terms {a.termsVersion}
        {applicationCount > 1 && ` · application #${applicationCount}`}
      </div>
      <Flag a={a} />
    </div>
  )
}

// Full version for the user detail page.
export function LandlordAnswersFull({ a }: { a: Answers }) {
  const rows: [string, React.ReactNode][] = [
    ['Rents as', RENTAL_LABEL[a.rentalType] ?? a.rentalType],
    ['Places to list', COUNT_LABEL[a.listingCount] ?? a.listingCount],
    ['Phone', phone(a)],
    ...(a.companyName ? [['Company', a.companyName] as [string, React.ReactNode]] : []),
    ...(a.companyWebsite ? [['Website', website(a)] as [string, React.ReactNode]] : []),
    ['Terms accepted', `Version ${a.termsVersion} · ${a.submitted}`],
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Flag a={a} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px 18px' }}>
        {rows.map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8' }}>{label}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1530', overflowWrap: 'anywhere' }}>{val}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#9a94a8', marginBottom: 6 }}>Declarations</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {Object.entries(DECLARATIONS).map(([key, label]) => {
            const ok = a.declarations.includes(key)
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: ok ? '#4a4654' : '#b91c1c' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: ok ? '#eafaf2' : '#fdecec', color: ok ? '#1f8a5b' : '#b91c1c', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flex: 'none' }}>{ok ? '✓' : '✕'}</span>
                {label}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
