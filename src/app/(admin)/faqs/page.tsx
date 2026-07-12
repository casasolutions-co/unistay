import { getFaqs } from '@/lib/data'
import { createFaq, updateFaq, toggleFaqPublished, deleteFaq, moveFaq } from '@/lib/actions'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterPills from '@/components/ui/FilterPills'
import { faqStatus } from '@/lib/utils'
import type { FaqCategory } from '@/lib/types'
import AddFaqButton from './AddFaqButton'
import FaqRowActions from './FaqRowActions'

const CATEGORY_LABELS: Record<FaqCategory, string> = {
  booking: 'Booking',
  payments: 'Payments',
  account: 'Account',
  safety: 'Safety',
}

const FILTER_PILLS = [
  { label: 'All',       value: 'all',      href: '/faqs' },
  { label: 'Booking',   value: 'booking',  href: '/faqs?category=booking' },
  { label: 'Payments',  value: 'payments', href: '/faqs?category=payments' },
  { label: 'Account',   value: 'account',  href: '/faqs?category=account' },
  { label: 'Safety',    value: 'safety',   href: '/faqs?category=safety' },
]

export default async function FaqsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category = 'all' } = await searchParams
  const allFaqs = await getFaqs()
  const faqs = category === 'all' ? allFaqs : allFaqs.filter(f => f.category === category)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-bricolage)', fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', margin: 0 }}>FAQs</h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6675', margin: '4px 0 0' }}>Content shown on the student app&apos;s Help Center.</p>
        </div>
        <AddFaqButton
          initialCategory={category === 'all' ? 'booking' : (category as FaqCategory)}
          createFaq={createFaq}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <FilterPills pills={FILTER_PILLS} current={category} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #ece8f3', borderRadius: 18, boxShadow: '0 1px 3px rgba(34,18,68,.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#fbfafd' }}>
              {['QUESTION', 'CATEGORY', 'STATUS', 'ACTIONS'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 3 ? 'right' : 'left', padding: i === 0 || i === 3 ? '13px 20px' : '13px 16px', fontSize: 11.5, fontWeight: 800, letterSpacing: '.04em', color: '#9a94a8', borderBottom: '1px solid #f1eef7' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {faqs.map(faq => {
              const fs = faqStatus(faq.published)
              const siblings = allFaqs.filter(f => f.category === faq.category)
              const idx = siblings.findIndex(f => f.id === faq.id)
              return (
                <tr key={faq.id} style={{ borderBottom: '1px solid #f5f2fa' }}>
                  <td style={{ padding: '13px 20px', maxWidth: 420 }}>
                    <div style={{ fontWeight: 700, color: '#1c1530' }}>{faq.question}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#9a94a8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{faq.answer}</div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#4a4654', fontWeight: 600 }}>{CATEGORY_LABELS[faq.category]}</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge label={fs.label} bg={fs.bg} color={fs.color} /></td>
                  <td style={{ padding: '13px 20px' }}>
                    <FaqRowActions
                      faq={faq}
                      onUpdate={updateFaq.bind(null, faq.id)}
                      togglePublished={toggleFaqPublished}
                      onDelete={deleteFaq.bind(null, faq.id)}
                      onMoveUp={idx > 0 ? moveFaq.bind(null, faq.id, 'up') : undefined}
                      onMoveDown={idx < siblings.length - 1 ? moveFaq.bind(null, faq.id, 'down') : undefined}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {faqs.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9a94a8', fontWeight: 600, fontSize: 14 }}>No FAQs match this view.</div>
        )}
      </div>
    </>
  )
}
